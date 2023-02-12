import multiprocessing
import pytest
import random
import requests
import uuid
from src import env, utils
from src.utils import response_contains_json
from src.test.cve_id_tests.cve_id import get_reserve_cve_ids
from src.test.org_user_tests.org import get_org_id_data, post_new_org

N_JOBS = multiprocessing.cpu_count()
ID_QUOTA_LIMIT = 100000  # FIXME: where do I belong?

#### POST /cve-id ####
def test_sequential_id_reservation_limit():
    """ there's no sequential reservation limit, and its been surprisingly easy
    to reserve 100,000 IDs in the past """
    if env.RUN_PERFORMANCE_TESTS == 'False':
        return
    uid = str(uuid.uuid4())
    post_new_org(uid, uid, ID_QUOTA_LIMIT)
    res = get_reserve_cve_ids(ID_QUOTA_LIMIT, utils.CURRENT_YEAR, uid)
    assert res.status_code == 200


def test_concurrent_sequential_id_reservation_limit():
    """ there's no sequential reservation limit, and its been surprisingly easy
    to reserve 100,000 IDs in the past """
    if env.RUN_PERFORMANCE_TESTS == 'False':
        return

    # create organizations
    uid = str(uuid.uuid4())
    for i in range(0, N_JOBS):
        tmp_uid = f'{uid}-{i}'
        post_new_org(tmp_uid, tmp_uid, ID_QUOTA_LIMIT)

    # asynchronously reserve 100k IDs
    year = random.randint(1999, utils.CURRENT_YEAR+1)
    pool = multiprocessing.Pool(N_JOBS)
    responses = [
        pool.apply_async(
            get_reserve_cve_ids,
            args=(ID_QUOTA_LIMIT, year, f'{uid}-{i}'))
        for i in range(0, N_JOBS)]
    pool.close()
    pool.join()
    for res in responses:
        assert res.get().status_code == 200


@pytest.mark.parametrize(
    "batch_type, amount",
    [('sequential', 1000), ('nonsequential', 100)])
def test_concurrent_id_reservation_scaling(batch_type, amount):
    """ This test will take the following procedure:
    1. Create N_JOBS new Orgs
    2. Set each of their ID quotas to 10*amount
    3. Reserve 10 sets of IDs at a time for each Org
    """
    if env.RUN_PERFORMANCE_TESTS == 'False':
        return

    # create organizations
    uid = str(uuid.uuid4())
    for i in range(0, N_JOBS):
        tmp_uid = f'{uid}-{i}'
        post_new_org(tmp_uid, tmp_uid, 10*amount)

    # asynchronously reserve increasing amounts of IDs
    count = 0
    ids = 0
    have_not_failed = True
    while have_not_failed:
        count += 1
        ids += amount  # tracks number of IDs we've reserved
        try:
            year = random.randint(1999, utils.CURRENT_YEAR+1)
            pool = multiprocessing.Pool(N_JOBS)
            responses = [
                pool.apply_async(
                    get_reserve_cve_ids,
                    args=(amount, year, f'{uid}-{i}', batch_type))
                for i in range(0, N_JOBS)]
            pool.close()
            pool.join()
            for res in responses:
                assert res.get().status_code == 200
            for i in range(0, N_JOBS):
                id_data = get_org_id_data(f'{uid}-{i}')
                response_contains_json(id_data, 'total_reserved', ids)
        except AssertionError:
            # we should have received an assertion error when we hit the new
            # org quota we set, at which point we should see 403 for having
            # explicitly exceeded the quota we set for our new org
            try:
                for res in responses:
                    assert res.get().status_code == 403
                    response_contains_json(res.get(), 'error', 'EXCEEDED_ID_QUOTA')
            except Exception:
                # since this test is exploratory, this line is staying, so I
                # can probe exactly what unexpected behavior occurred
                import pdb
                pdb.set_trace()
        except Exception:
            import pdb
            pdb.set_trace()


def test_interleaved_sequential_non_sequential_scaling():
    """ This test will take the following procedure:
    1. Create N_JOBS new Orgs
    2. Set each of their ID quotas to 100000
    3. Reserve either 1000 sequential or 10 non-sequential (randomly) until
       an Org hits its quota
    """
    if env.RUN_PERFORMANCE_TESTS == 'False':
        return

    # create organizations
    uid = str(uuid.uuid4())
    for i in range(0, N_JOBS):
        tmp_uid = f'{uid}-{i}'
        post_new_org(tmp_uid, tmp_uid, 100000)

    # asynchronously reserve increasing amounts of IDs
    count = 0
    ids = 0
    have_not_failed = True
    while have_not_failed:
        year = random.randint(1999, utils.CURRENT_YEAR+1)
        is_sequential = random.choice([True, False])
        if is_sequential:
            batch_type = 'sequential'
            amount = 1000
        else:
            batch_type = 'nonsequential'
            amount = 10
        count += 1
        ids += amount  # tracks number of IDs we've reserved
        try:
            pool = multiprocessing.Pool(N_JOBS)
            responses = [
                pool.apply_async(
                    get_reserve_cve_ids,
                    args=(amount, year, f'{uid}-{i}', batch_type))
                for i in range(0, N_JOBS)]
            pool.close()
            pool.join()
            for res in responses:
                assert res.get().status_code == 200
            for i in range(0, N_JOBS):
                id_data = get_org_id_data(f'{uid}-{i}')
                response_contains_json(id_data, 'total_reserved', ids)
        except AssertionError:
            # we should have received an assertion error when we hit the new
            # org quota we set, at which point we should see 403 for having
            # explicitly exceeded the quota we set for our new org
            try:
                for res in responses:
                    assert res.get().status_code == 403
                    response_contains_json(res.get(), 'error', 'EXCEEDED_ID_QUOTA')
            except Exception:
                # since this test is exploratory, this line is staying, so I
                # can probe exactly what unexpected behavior occurred
                import pdb
                pdb.set_trace()
        except Exception:
            import pdb
            pdb.set_trace()
