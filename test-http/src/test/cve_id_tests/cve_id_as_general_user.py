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
cve_id = 'CVE-1999-0001'

#### GET /cve-id/:id ####
def test_get_cve_id(reg_user_headers):
    """ the first ID from 1999 should always exist """
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}/{cve_id}',
        headers=reg_user_headers
    )
    ok_response_contains(res, cve_id)


def test_get_cve_id_bad_org_header(reg_user_headers):
    """ unauthenticated users can't get full information about IDs """
    uid = str(uuid.uuid4())
    tmp = copy.deepcopy(reg_user_headers)
    tmp['CVE-API-ORG'] = uid
    tmp['CVE-API-USER'] = uid
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}/{cve_id}',
        headers=tmp
    )
    assert res.status_code == 200
    assert 'requested_by' not in res.content.decode()

def test_get_cve_id_id(reg_user_headers):
    """ the id parameter must be a string """
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}/{cve_id}',
        headers=reg_user_headers
    )
    assert isinstance (cve_id, str)

"""
Regular users now CAN update CVE ID state.
This test should be reinstituted once the problem
of this test suite using the same CVE ID for all
these tests is resolved. Tests should be independent
of one another but these tests are highly dependent
on each other's state changes.
"""
#### PUT /cve-id/:id ####
# def test_put_cve_id_id_state(reg_user_headers):
#     """ regular user cannot update id's state """
#     res = requests.put(
#         f'{env.AWG_BASE_URL}{CVE_ID_URL}/{cve_id}',
#         headers=reg_user_headers,
#         params={'state':'RESERVED'}
#     )
#     assert res.status_code == 200
#     # This should not result in an error, but a success message.
#     response_contains_json(res, 'error', 'SECRETARIAT_ONLY')


#### POST /cve-id ####
def test_post_cve_id_update_parameters(reg_user_headers):
    """ org users can update own information """
    res = requests.post(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=reg_user_headers,
        params={
            'amount': '10',
            'batch_type': 'sequential',
            'cve_year': f'{utils.CURRENT_YEAR}',
            'short_name': reg_user_headers['CVE-API-ORG']
        }
    )
    assert res.status_code == 200


def test_post_cve_id_no_params(reg_user_headers):
    """ batch type is the only optional parameter for reserving ids """
    res = requests.post(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=reg_user_headers
    )
    assert res.status_code == 400
    response_contains(res, 'amount')
    response_contains(res, 'cve_year')
    response_contains(res, 'short_name')


def test_post_cve_id_empty_params(reg_user_headers):
    """ cve services doesn't accept id reservation with blank parameters """
    res = requests.post(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=reg_user_headers,
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


def test_post_cve_id_wrong_header(reg_user_headers):
    """ reg_user_headers cannot post for 'mitre' org """
    res = requests.post(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=reg_user_headers,
        params={
            'amount': '10',
            'batch_type': 'sequential',
            'cve_year': f'{utils.CURRENT_YEAR}',
            'short_name': 'mitre'
        }
    )
    # NOTE: this error also occurs when short_name is empty and invalid, 
    # expected error is 'NO_ORG_SHORTNAME' and 'ORG_DNE' respectively
    assert res.status_code == 403
    response_contains_json(res, 'error', 'ORG_CANNOT_RESERVE_FOR_OTHER')


def test_post_cve_id_empty_year(reg_user_headers):
    """ cve services rejects empty year """
    res = requests.post(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=reg_user_headers,
        params={
            'amount': '10',
            'batch_type': 'sequential',
            'cve_year': '',
            'short_name': 'mitre'
        }
    )
    assert res.status_code == 400
    response_contains_json(res, 'error', 'BAD_INPUT') 

def test_get_cve_id_bulk_download_user(bulk_download_user_headers):
    """ bulk download user should not be a CNA so can't reserve ids """
    res = requests.post(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=bulk_download_user_headers,
        params={
            'amount': '1',
            'cve_year': f'{utils.CURRENT_YEAR}',
            'short_name': bulk_download_user_headers['CVE-API-ORG']
        }
    )
    assert res.status_code == 403
    response_contains_json(res, 'error', 'CNA_ONLY')    

def test_post_cve_id_bad_year(reg_user_headers):
    """ cve services rejects year that isn't a 4 digit number"""
    res = requests.post(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=reg_user_headers,
        params={
            'amount': '10',
            'batch_type': 'sequential',
            'cve_year': '20111',
            'short_name': 'mitre'
        }
    )
    assert res.status_code == 400
    response_contains_json(res, 'error', 'BAD_INPUT')


def test_post_cve_id_empty_amount(reg_user_headers):
    """ cve services rejects empty amount """
    res = requests.post(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=reg_user_headers,
        params={
            'amount': '',
            'batch_type': 'sequential',
            'cve_year': f'{utils.CURRENT_YEAR}',
            'short_name': 'mitre'
        }
    )
    assert res.status_code == 400
    response_contains_json(res, 'error', 'BAD_INPUT') 


def test_post_cve_id_invalid_amount(reg_user_headers):
    """ cve services rejects amount less than or equal to 0 """
    res = requests.post(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=reg_user_headers,
        params={
            'amount': '-1',
            'batch_type': 'sequential',
            'cve_year': f'{utils.CURRENT_YEAR}',
            'short_name': reg_user_headers['CVE-API-ORG']
        }
    )
    assert res.status_code == 400
    response_contains_json(res, 'error', 'INVALID_AMOUNT')


def test_post_cve_id_no_batch_type(reg_user_headers):
    """ cve services rejects not having a batch type"""
    res = requests.post(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=reg_user_headers,
        params={
            'amount': '10',
            'batch_type': '',
            'cve_year': f'{utils.CURRENT_YEAR}',
            'short_name': reg_user_headers['CVE-API-ORG']
        }
    )
    assert res.status_code == 400
    response_contains_json(res, 'error', 'NO_BATCH_TYPE')


def test_post_cve_id_invalid_batch_type(reg_user_headers):
    """ cve services rejects batch types that aren't 'sequential' or 'nonsequential' """
    res = requests.post(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=reg_user_headers,
        params={
            'amount': '10',
            'batch_type': '---',
            'cve_year': f'{utils.CURRENT_YEAR}',
            'short_name':  reg_user_headers['CVE-API-ORG']
        }
    )
    assert res.status_code == 400
    response_contains_json(res, 'error', 'INVALID_BATCH_TYPE')


def test_post_cve_id_bad_amount(reg_user_headers):
    """ api rejects non-numeric amount when requesting IDs """
    res = get_reserve_cve_ids('a', utils.CURRENT_YEAR, reg_user_headers['CVE-API-USER'])
    assert res.status_code == 400
    assert res.reason == 'Bad Request'
    response_contains_json(res, 'error', 'BAD_INPUT')
    assert_contains(res, 'amount')


def test_post_cve_id_reserve_priority(reg_user_headers):
    """ priority ids can be reserved on behalf of the general user org """
    res = requests.post(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=reg_user_headers,
        params={
            'amount': '1',
            'cve_year': f'{utils.CURRENT_YEAR}',
            'short_name': reg_user_headers['CVE-API-ORG']
        }
    )
    ok_response_contains(res, f'CVE-{utils.CURRENT_YEAR}-')
    assert json.loads(res.content.decode())['cve_ids']
    assert len(json.loads(res.content.decode())['cve_ids']) == 1

    priority_id = json.loads(res.content.decode())['cve_ids'][0]['cve_id']
    assert int(priority_id.split('-')[-1]) < 20000
    for key in json.loads(res.content.decode())['meta'].keys(): # Check that remaining_quota is in response
        assert key == 'remaining_quota'

# Does this constitute a performance test? The distinction I'm making is that
# performance tests stress the system overall, while these tests try to
# test both "reservation works" and "there's some reasonable amount that we
# can request that doesn't stress the system"
@pytest.mark.parametrize(
    "batch_type, amount",
    [('sequential', 10), ('sequential', 1000),
     ('nonsequential', 1), ('nonsequential', 10)])
def test_post_cve_id_reservation(batch_type, amount, reg_user_headers):
    """ sequential ids can be reserved on behalf of the mitre org """
    res = get_reserve_cve_ids(amount, utils.CURRENT_YEAR, reg_user_headers['CVE-API-ORG'], batch_type)
    ok_response_contains(res, f'CVE-{utils.CURRENT_YEAR}-')
    assert json.loads(res.content.decode())['cve_ids']
    assert len(json.loads(res.content.decode())['cve_ids']) == amount
    # cna and user must exist
    assert 'cna' in res.content.decode()
    assert 'user' in res.content.decode()
    for key in json.loads(res.content.decode())['meta'].keys(): # Check that remaining_quota is in response
        assert key == 'remaining_quota'

def test_post_cve_id_reserve_sequential_over_quota(reg_user_headers):
    """ the services api enforces a max quota of 100,000 """
    res = get_reserve_cve_ids(100001, utils.CURRENT_YEAR, reg_user_headers['CVE-API-ORG'])
    assert res.status_code == 403
    response_contains_json(res, 'error', 'EXCEEDED_ID_QUOTA')


def test_post_cve_id_reserve_nonsequential_over_limit(reg_user_headers):
    """ the services api enforces a max non-sequential limit of 10 """
    res = get_reserve_cve_ids(11, utils.CURRENT_YEAR, reg_user_headers['CVE-API-ORG'], 'nonsequential')
    assert res.status_code == 403
    response_contains_json(res, 'error', 'OVER_NONSEQUENTIAL_MAX_AMOUNT')


#### GET /cve-id ####
def test_get_cve_id_by_time_reserved(reg_user_headers):
    """ we can get ids immediately after reserving them using the time they're
    reserved (noting that this may not work against a shared integration
    environment, we check that at least this many have been reserved) """
    n_ids = 10
    time.sleep(1)
    t_before = get_now_timestamp()
    time.sleep(1)
    res_ids = get_reserve_cve_ids(n_ids, utils.CURRENT_YEAR, reg_user_headers['CVE-API-ORG'])
    time.sleep(1)
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


def test_get_cve_id_by_time_modified(reg_user_headers):
    """ we can get ids immediately after reserving them using the time they're
    reserved (noting that this may not work against a shared integration
    environment, we check that at least this many have been reserved) """
    n_ids = 10
    time.sleep(1)
    t_before = get_now_timestamp()
    time.sleep(1)
    res_ids = get_reserve_cve_ids(n_ids, utils.CURRENT_YEAR, reg_user_headers['CVE-API-ORG'])
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


def test_get_cve_id_with_params(reg_user_headers):
    """ org user can retrieve ids"""
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=reg_user_headers,
        params={
            'page': 1,
            'state': 'PUBLISHED',
            'cve_id_year': 2011
        }
    )
    assert res.status_code == 200


def test_get_cve_id_empty_parameters(reg_user_headers):
    """ cannot get id with empty parameters """
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=reg_user_headers,
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


def test_get_cve_id_page_format_number(reg_user_headers):
    """ page must be an integer' """
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=reg_user_headers,
        params={
            'page': 'test',
        }
    )
    assert res.status_code == 400
    response_contains_json(res, 'error', 'BAD_INPUT')


def test_get_cve_id_page_limit(reg_user_headers):
    """ page must be greater than or equal to 1' """
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=reg_user_headers,
        params={
            'page': '-1',
        }
    )
    assert res.status_code == 400
    response_contains_json(res, 'error', 'BAD_INPUT')


def test_get_cve_id_state_in_choices(reg_user_headers):
    """ state parameter can only be 'REJECTED', 'PUBLISHED' or 'RESERVED' """
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=reg_user_headers,
        params={
            'state': 'TEST',
        }
    )
    assert res.status_code == 400
    response_contains_json(res, 'error', 'BAD_INPUT')


def test_get_cve_id_year_format_with_letters(reg_user_headers):
    """ cve_id_year format cannot have letters  """
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=reg_user_headers,
        params={
            'cve_id_year': 'test',
        }
    )
    assert res.status_code == 400
    response_contains_json(res, 'error', 'BAD_INPUT')


def test_get_cve_id_year_format_with_digits(reg_user_headers):
    """ cve_id_year format must be 4 digits only  """
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=reg_user_headers,
        params={
            'cve_id_year': '20111',
        }
    )
    assert res.status_code == 400
    response_contains_json(res, 'error', 'BAD_INPUT')


def test_get_cve_id_available_state(reg_user_headers):
    """ CVE ID filter endpoint does not return any IDs with state 'AVAILABLE' """
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_ID_URL}',
        headers=reg_user_headers,
        params={
            'page': 1,
            'state': 'PUBLISHED',
            'cve_id_year': 2011
        }
    )
    assert res.status_code == 200
    assert 'AVAILABLE' not in res.content.decode()


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
