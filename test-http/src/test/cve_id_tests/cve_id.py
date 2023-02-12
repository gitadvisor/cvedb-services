import copy
import datetime as dt
import json
import pytest
import requests
import time
import uuid
from src import env, utils
from src.utils import (assert_contains, ok_response_contains,
                       response_contains, response_contains_json,
                       get_now_timestamp)

CVE_ID_URL = '/api/cve-id'
cve_id = 'CVE-1999-0002'

#### GET /cve-id/:id ####


def test_get_cve_id():
    """ the first ID from 1999 should always exist """
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}/{cve_id}',
        headers=utils.BASE_HEADERS
    )
    ok_response_contains(res, cve_id)


def test_get_cve_id_bad_org_header():
    """ unauthenticated users can't get full information about IDs """
    uid = str(uuid.uuid4())
    tmp = copy.deepcopy(utils.BASE_HEADERS)
    tmp['CVE-API-ORG'] = uid
    tmp['CVE-API-USER'] = uid
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}/{cve_id}',
        headers=tmp
    )
    assert res.status_code == 200
    assert 'requested_by' not in res.content.decode()


def test_get_cve_id_id():
    """ the id parameter must be a string """
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}/{cve_id}',
        headers=utils.BASE_HEADERS
    )
    assert isinstance(cve_id, str)


#### PUT /cve-id/:id ####
def test_put_cve_id_id():
    """ an id can be updated to rejected and then back to reserved """
    res = requests.put(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}/{cve_id}',
        headers=utils.BASE_HEADERS,
        params={'state': 'REJECTED'}
    )
    ok_response_contains(res, f'{cve_id} was successfully updated.')

    res = requests.put(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}/{cve_id}',
        headers=utils.BASE_HEADERS,
        params={'state': 'RESERVED'}
    )
    ok_response_contains(res, f'{cve_id} was successfully updated.')


"""
This test will be reinstated when the code is completed to prevent CVE IDs
from being changed to the PUBLISHED state.
"""
# def test_put_cve_id_id_state_published():
#     """ an id's state cannot be set to published """
#     res = requests.put(
#         f'{env.AWG_BASE_URL}{CVE_ID_URL}/{cve_id}',
#         headers=utils.BASE_HEADERS,
#         params={'state':'REJECTED'}
#     )
#     ok_response_contains(res, f'{cve_id} was successfully updated.')

#     res = requests.put(
#         f'{env.AWG_BASE_URL}{CVE_ID_URL}/{cve_id}',
#         headers=utils.BASE_HEADERS,
#         params={'state':'PUBLISHED'}
#     )
#     assert res.status_code == 400
#     response_contains_json(
#         res, 'message',
#         'Cannot change the state to PUBLISHED.')


def test_put_cve_id_id_state_blarg():
    """ an id's state cannot be changed to a non-existent state """
    res = requests.put(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}/{cve_id}',
        headers=utils.BASE_HEADERS,
        params={'state': 'BLARG'}
    )
    assert res.status_code == 400
    assert 'BLARG' not in res.content.decode()
    response_contains(res, 'state')
    response_contains_json(res, 'message', 'Parameters were invalid')


def test_put_cve_id_id_no_params():
    """ cve id endpoint ... accepts an empty query set? """
    res = requests.put(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}/{cve_id}',
        headers=utils.BASE_HEADERS
    )
    # NOTE: should this behave as if an update was successful, when no params
    # were included and nothing was actually updated?
    ok_response_contains(res, f'{cve_id} was successfully updated.')


def test_put_cve_id_id_empty_params():
    """ cve services id update endpoint fails for empty query parameters """
    res = requests.put(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}/{cve_id}',
        headers=utils.BASE_HEADERS,
        params={'state': '', 'cna': ''}
    )
    assert res.status_code == 400
    response_contains(res, 'state')
    response_contains_json(res, 'message', 'Parameters were invalid')

#### POST /cve-id ####


def test_post_cve_id_no_params():
    """ batch type is the only optional parameter for reserving ids """
    res = requests.post(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=utils.BASE_HEADERS
    )
    assert res.status_code == 400
    response_contains(res, 'amount')
    response_contains(res, 'cve_year')
    response_contains(res, 'short_name')


def test_post_cve_id_empty_params():
    """ cve services doesn't accept id reservation with blank parameters """
    res = requests.post(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=utils.BASE_HEADERS,
        params={
            'amount': '',
            'batch_type': '',
            'cve_year': '',
            'short_name': ''
        }
    )
    # NOTE: there isn't a `short_name` error here, why?
    assert res.status_code == 400
    response_contains(res, 'amount')
    response_contains(res, 'cve_year')


def test_post_cve_id_empty_short_name():
    """ cve services rejects empty short name separately """
    res = requests.post(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=utils.BASE_HEADERS,
        params={
            'amount': '10',
            'batch_type': 'sequential',
            'cve_year': f'{utils.CURRENT_YEAR}',
            'short_name': ''
        }
    )
    assert res.status_code == 400
    response_contains_json(res, 'error', 'BAD_INPUT')


def test_post_cve_id_organization_access():
    """ services rejects ID reservation for nonexistent Org as identified by short name """
    res = requests.post(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=utils.BASE_HEADERS,
        params={
            'amount': '10',
            'batch_type': 'sequential',
            'cve_year': f'{utils.CURRENT_YEAR}',
            'short_name': 'test'
        }
    )
    assert res.status_code == 403
    response_contains_json(res, 'error', 'ORG_DNE')


def test_post_cve_id_shortname_format():
    """ cve services rejects shortname that's not a string """
    res = requests.post(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=utils.BASE_HEADERS,
        params={
            'amount': '10',
            'batch_type': 'sequential',
            'cve_year': f'{utils.CURRENT_YEAR}',
            'short_name': '1111'
        }
    )
    assert res.status_code == 403
    response_contains_json(res, 'error', 'ORG_DNE')


def test_post_cve_id_empty_year():
    """ cve services rejects empty year """
    res = requests.post(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=utils.BASE_HEADERS,
        params={
            'amount': '10',
            'batch_type': 'sequential',
            'cve_year': '',
            'short_name': 'mitre'
        }
    )
    assert res.status_code == 400
    response_contains_json(res, 'error', 'BAD_INPUT')


def test_post_cve_id_bad_year():
    """ cve services rejects year that isn't a 4 digit number"""
    res = requests.post(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=utils.BASE_HEADERS,
        params={
            'amount': '10',
            'batch_type': 'sequential',
            'cve_year': '20111',
            'short_name': 'mitre'
        }
    )
    assert res.status_code == 400
    response_contains_json(res, 'error', 'BAD_INPUT')


def test_post_cve_id_empty_amount():
    """ cve services rejects empty amount """
    res = requests.post(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=utils.BASE_HEADERS,
        params={
            'amount': '',
            'batch_type': 'sequential',
            'cve_year': f'{utils.CURRENT_YEAR}',
            'short_name': 'mitre'
        }
    )
    assert res.status_code == 400
    response_contains_json(res, 'error', 'BAD_INPUT')


def test_post_cve_id_invalid_amount():
    """ cve services rejects amount less than or equal to 0 """
    res = requests.post(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=utils.BASE_HEADERS,
        params={
            'amount': '-1',
            'batch_type': 'sequential',
            'cve_year': f'{utils.CURRENT_YEAR}',
            'short_name': 'mitre'
        }
    )
    assert res.status_code == 400
    response_contains_json(res, 'error', 'INVALID_AMOUNT')


def test_post_cve_id_no_batch_type():
    """ cve services rejects not having a batch type"""
    res = requests.post(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=utils.BASE_HEADERS,
        params={
            'amount': '10',
            'batch_type': '',
            'cve_year': f'{utils.CURRENT_YEAR}',
            'short_name': 'mitre'
        }
    )
    assert res.status_code == 400
    response_contains_json(res, 'error', 'NO_BATCH_TYPE')


def test_post_cve_id_invalid_batch_type():
    """ cve services rejects batch types that aren't 'sequential' or 'nonsequential' """
    res = requests.post(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=utils.BASE_HEADERS,
        params={
            'amount': '10',
            'batch_type': '---',
            'cve_year': f'{utils.CURRENT_YEAR}',
            'short_name': 'mitre'
        }
    )
    assert res.status_code == 400
    response_contains_json(res, 'error', 'INVALID_BATCH_TYPE')


def test_post_cve_id_bad_amount():
    """ api rejects non-numeric amount when requesting IDs """
    res = get_reserve_cve_ids('a', utils.CURRENT_YEAR, 'mitre')
    assert res.status_code == 400
    assert res.reason == 'Bad Request'
    response_contains_json(res, 'error', 'BAD_INPUT')
    assert_contains(res, 'amount')


#### PUT /cve-id/:id ####
def test_put_cve_id_duplicate_state():
    """ api rejects ID updates with duplicate state parameter """
    res = requests.put(
        (f'{env.AWG_BASE_URL}{CVE_ID_URL}/{cve_id}'
         '?state=RESERVED&state=REJECTED'),
        headers=utils.BASE_HEADERS
    )
    assert res.status_code == 400
    assert res.reason == 'Bad Request'
    response_contains_json(res, 'error', 'BAD_INPUT')
    assert_contains(res, 'state')


#### POST /cve-id ####
def test_post_cve_id_reserve_priority():
    """ priority ids can be reserved on behalf of the mitre org """
    res = requests.post(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=utils.BASE_HEADERS,
        params={
            'amount': '1',
            'cve_year': f'{utils.CURRENT_YEAR}',
            'short_name': 'mitre'
        }
    )
    ok_response_contains(res, f'CVE-{utils.CURRENT_YEAR}-')
    assert json.loads(res.content.decode())['cve_ids']
    assert len(json.loads(res.content.decode())['cve_ids']) == 1

    priority_id = json.loads(res.content.decode())['cve_ids'][0]['cve_id']
    assert int(priority_id.split('-')[-1]) < 20000
    # Check that remaining_quota is in response
    for key in json.loads(res.content.decode())['meta'].keys():
        assert key == 'remaining_quota'

# Does this constitute a performance test? The distinction I'm making is that
# performance tests stress the system overall, while these tests try to
# test both "reservation works" and "there's some reasonable amount that we
# can request that doesn't stress the system"


@pytest.mark.parametrize(
    "batch_type, amount",
    [('sequential', 10), ('sequential', 1000),
     ('nonsequential', 1), ('nonsequential', 10)])
def test_post_cve_id_reservation(batch_type, amount):
    """ sequential ids can be reserved on behalf of the mitre org """
    res = get_reserve_cve_ids(amount, utils.CURRENT_YEAR, 'mitre', batch_type)
    ok_response_contains(res, f'CVE-{utils.CURRENT_YEAR}-')
    assert json.loads(res.content.decode())['cve_ids']
    assert len(json.loads(res.content.decode())['cve_ids']) == amount
    # cna and user must exist
    assert 'cna' in res.content.decode()
    assert 'user' in res.content.decode()
    # Check that remaining_quota is in response
    for key in json.loads(res.content.decode())['meta'].keys():
        assert key == 'remaining_quota'


def test_post_cve_id_reserve_sequential_over_quota():
    """ the services api enforces a max quota of 100,000 """
    res = get_reserve_cve_ids(100001, utils.CURRENT_YEAR, 'mitre')
    assert res.status_code == 403
    response_contains_json(res, 'error', 'EXCEEDED_ID_QUOTA')


def test_post_cve_id_reserve_nonsequential_over_limit():
    """ the services api enforces a max non-sequential limit of 10 """
    res = get_reserve_cve_ids(11, utils.CURRENT_YEAR, 'mitre', 'nonsequential')
    assert res.status_code == 403
    response_contains_json(res, 'error', 'OVER_NONSEQUENTIAL_MAX_AMOUNT')


#### GET /cve-id ####
def test_get_cve_id_by_time_reserved():
    """ we can get ids immediately after reserving them using the time they're
    reserved (noting that this may not work against a shared integration
    environment, we check that at least this many have been reserved) """
    n_ids = 10
    time.sleep(1)
    t_before = get_now_timestamp()
    time.sleep(3)
    res_ids = get_reserve_cve_ids(n_ids, utils.CURRENT_YEAR, 'mitre')
    time.sleep(3)
    t_after = get_now_timestamp()

    res_get_ids = requests.get(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=utils.BASE_HEADERS,
        params={
            'time_reserved.lt': t_after,
            'time_reserved.gt': t_before
        }
    )
    ok_response_contains(res_get_ids, f'CVE-{utils.CURRENT_YEAR}-')
    assert len(json.loads(res_get_ids.content.decode())['cve_ids']) == n_ids


def test_get_cve_id_by_time_modified():
    """ we can get ids immediately after reserving them using the time they're
    reserved (noting that this may not work against a shared integration
    environment, we check that at least this many have been reserved) """
    n_ids = 10
    time.sleep(1)
    t_before = get_now_timestamp()
    time.sleep(1)
    res_ids = get_reserve_cve_ids(n_ids, utils.CURRENT_YEAR, 'mitre')
    time.sleep(1)
    t_after = get_now_timestamp()

    res_get_ids = requests.get(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=utils.BASE_HEADERS,
        params={
            'time_modified.lt': t_after,
            'time_modified.gt': t_before
        }
    )
    ok_response_contains(res_get_ids, f'CVE-{utils.CURRENT_YEAR}-')
    assert len(json.loads(res_get_ids.content.decode())['cve_ids']) == n_ids


def test_get_cve_id_empty_parameters():
    """ cannot get id with empty parameters """
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=utils.BASE_HEADERS,
        params={
            'page': ' ',
            'state': ' ',
            'cve_id_year': ' ',
            'time_reserved.lt': ' ',
            'time_reserved.gt': ' ',
            'time_modified.lt': ' ',
            'time_modified.gt': ' '
        }
    )
    assert res.status_code == 400
    response_contains(res, 'page')
    response_contains(res, 'state')
    response_contains(res, 'cve_id_year')
    response_contains(res, 'time_reserved.lt')
    response_contains(res, 'time_reserved.gt')
    response_contains(res, 'time_modified.lt')
    response_contains(res, 'time_modified.gt')
    response_contains_json(res, 'error', 'BAD_INPUT')


def test_get_cve_id_page_format_number():
    """ page must be an integer' """
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=utils.BASE_HEADERS,
        params={
            'page': 'test',
        }
    )
    assert res.status_code == 400
    response_contains_json(res, 'error', 'BAD_INPUT')


def test_get_cve_id_page_limit():
    """ page must be greater than or equal to 1' """
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=utils.BASE_HEADERS,
        params={
            'page': '-1',
        }
    )
    assert res.status_code == 400
    response_contains_json(res, 'error', 'BAD_INPUT')


def test_get_cve_id_state_in_choices():
    """ state parameter can only be 'REJECTED', 'PUBLISHED' or 'RESERVED' """
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=utils.BASE_HEADERS,
        params={
            'state': 'TEST',
        }
    )
    assert res.status_code == 400
    response_contains_json(res, 'error', 'BAD_INPUT')


def test_get_cve_id_year_format_with_letters():
    """ cve_id_year format cannot have letters  """
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=utils.BASE_HEADERS,
        params={
            'cve_id_year': 'test',
        }
    )
    assert res.status_code == 400
    response_contains_json(res, 'error', 'BAD_INPUT')


def test_get_cve_id_year_format_with_digits():
    """ cve_id_year format must be 4 digits only  """
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=utils.BASE_HEADERS,
        params={
            'cve_id_year': '20111',
        }
    )
    assert res.status_code == 400
    response_contains_json(res, 'error', 'BAD_INPUT')


def test_get_cve_id_available_state():
    """ CVE ID filter endpoint does not return any IDs with state 'AVAILABLE' """
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=utils.BASE_HEADERS,
        params={
            'page': 1,
            'state': 'PUBLISHED',
            'cve_id_year': 2011
        }
    )
    assert res.status_code == 200
    assert 'AVAILABLE' not in res.content.decode()
    response_contains(res, 'state')


# CVE-ID ENDPOINT UTILITIES
# ==============================================================================
# these are unique to the `{CVE_ID_URL}` endpoint for the AWG system


def get_reserve_cve_ids(
        amount, year, cna_short_name, batch_type='sequential'):
    return requests.post(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=utils.BASE_HEADERS,
        params={
            'amount': f'{amount}',
            'batch_type': batch_type,
            'cve_year': f'{year}',
            'short_name': cna_short_name
        }
    )
