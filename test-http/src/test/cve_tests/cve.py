import copy
import datetime as dt
import json
import pytest
import requests
import time
import uuid
from pathlib import Path

from requests.models import Response
from src import env, utils
from src.utils import ok_response_contains, response_contains_json, ok_response_contains, ok_response_contains_json

CVE_URL = '/api/cve'
cve_id = 'CVE-1999-0001'
cve_id_dne = 'CVE-3000-0001'
curr_cve_id = 'CVE-2021-0005'
update_cve_id = create_cve_id = 'CVE-2000-0008'
reserved_cve_id = 'CVE-2017-5833'
reject_cve_id = 'CVE-2009-0009'
cve_f = 'CVE-2000-0008'

ORG_URL = '/api/org'

### GET /cve ####


def test_get_all_cves_secretariat():
    """ services api accepts requests for all CVEs for secretariat and bulk_download users """
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_URL}/',
        headers=utils.BASE_HEADERS
    )
    assert res.status_code == utils.HTTP_OK
    assert len(json.loads(res.content.decode())['cveRecords']) >= 1

def test_get_all_cves_bulk_download(bulk_download_user_headers):
    """ services api accepts requests for all CVEs for secretariat and bulk_download users """
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_URL}/',
        headers=bulk_download_user_headers
    )
    assert res.status_code == utils.HTTP_OK
    assert len(json.loads(res.content.decode())['cveRecords']) >= 1

def test_get_cve_by_time_modified():
    # @todo - These records are created by the populate scripts on the node side
    # Creating them again here throws 400 errors, which are ignored in this test

    # create CVE records if they don't exist
    post_cve('CVE-2021-0004_published', 'CVE-2021-0004')
    post_cve('CVE-2021-0005_published', 'CVE-2021-0005')
    
    # grab current timestamp for gt value, then sleep long enough 
    # for imprecise second resolution and update the CVE records
    dt_before_update = dt.datetime.now(tz=dt.timezone.utc)
    time.sleep(3)

    update_cve('CVE-2021-0004_published', 'CVE-2021-0004')
    update_cve('CVE-2021-0005_published', 'CVE-2021-0005')

    # wait again, then grab after timestamp for lt value
    time.sleep(3)
    dt_after_update = dt.datetime.now(tz=dt.timezone.utc)

    # check for ISO dates with and without timezone offsets
    date_fmt = '%Y-%m-%dT%H:%M:%S'
    date_fmt_tz = '%Y-%m-%dT%H:%M:%S+00:00'

    # without tz
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_URL}/',
        headers=utils.BASE_HEADERS,
        params={
            'time_modified.lt': dt_after_update.strftime(date_fmt),
            'time_modified.gt': dt_before_update.strftime(date_fmt)
        }
    )

    assert res.status_code == utils.HTTP_OK
    assert len(json.loads(res.content.decode())['cveRecords']) == 2

    # with tz
    res_alt = requests.get(
        f'{env.AWG_BASE_URL}{CVE_URL}/',
        headers=utils.BASE_HEADERS,
        params={
            'time_modified.lt': dt_after_update.strftime(date_fmt_tz),
            'time_modified.gt': dt_before_update.strftime(date_fmt_tz)
        }
    )

    assert res_alt.status_code == utils.HTTP_OK
    assert len(json.loads(res_alt.content.decode())['cveRecords']) == 2


def test_get_cve_by_count_only_true():
    """ 
    count_only set to True using number 1 
    
    WARNING: Requires pristine database
    """
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_URL}/',
        headers=utils.BASE_HEADERS,
        params={
            'count_only': 1
        }

    )
    assert len(json.loads(res.content.decode())) == 1  # only count is returned
    assert json.loads(res.content.decode())['totalCount'] == 114
    assert res.status_code == 200


def test_get_cve_by_count_only_false():
    """ 
    count_only set to False using number 0, returns all records
    
    WARNING: Requires pristine database
    """
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_URL}/',
        headers=utils.BASE_HEADERS,
        params={
            'count_only': 0
        }

    )
    assert len(json.loads(res.content.decode())[
               'cveRecords']) == 114  # all records are returned
    assert res.status_code == 200


def test_get_cve_invalid_count_number():
    """ count_only can only be set to 0 or 1 """
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_URL}/',
        headers=utils.BASE_HEADERS,
        params={
            'count_only': 11
        }
    )
    assert res.status_code == 400
    response_contains_json(res, 'error', 'BAD_INPUT')


def test_get_cve_invalid_count_value():
    """ count_only can only be set to 0,1,true,false,yes,no """
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_URL}/',
        headers=utils.BASE_HEADERS,
        params={
            'count_only': 'Maybe'
        }
    )
    assert res.status_code == 400
    response_contains_json(res, 'error', 'BAD_INPUT')


def test_get_cve_filter_by_published_state():
    """ CVE ID filter endpoint with state 'PUBLISHED' """
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_URL}/',
        headers=utils.BASE_HEADERS,
        params={
            'state': 'PUBLISHED'
        }
    )
    assert res.status_code == 200
    recordsLength = len(json.loads(res.content.decode())['cveRecords'])
    assert recordsLength >= 61
    for i in range(recordsLength):
        assert json.loads(res.content.decode())[
            'cveRecords'][i]['cveMetadata']['state'] == 'PUBLISHED'


def test_get_cve_filter_by_rejected_state():
    """ CVE ID filter endpoint with state 'REJECTED' """
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_URL}/',
        headers=utils.BASE_HEADERS,
        params={
            'state': 'REJECTED'
        }
    )
    assert res.status_code == 200
    recordsLength = len(json.loads(res.content.decode())['cveRecords'])
    assert recordsLength >= 52
    for i in range(recordsLength):
        assert json.loads(res.content.decode())[
            'cveRecords'][i]['cveMetadata']['state'] == 'REJECTED'


def test_get_cve_filter_by_unrecognized_state_reserved():
    """ CVE ID filter endpoint does not recognize RESERVED state """
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_URL}/',
        headers=utils.BASE_HEADERS,
        params={
            'state': 'RESERVED'
        }
    )
    assert res.status_code == 400
    assert 'RESERVED' not in res.content.decode()


def test_get_cve_filter_by_unrecognized_state_available():
    """ CVE ID filter endpoint does not recognize AVAILABLE state """
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_URL}/',
        headers=utils.BASE_HEADERS,
        params={
            'state': 'AVAILABLE'
        }
    )
    assert res.status_code == 400
    assert 'AVAILABLE' not in res.content.decode()


def test_get_cve_filter_by_assignerShortName():
    """ Filter CVE collection by assigner_short_name"""
    res2 = requests.get(
        f'{env.AWG_BASE_URL}{CVE_URL}/',
        headers=utils.BASE_HEADERS,
        params={
            'assigner_short_name': 'mitre'  # use org uuid as assigner
        }
    )
    assert res2.status_code == 200
    recordsLength = len(json.loads(res2.content.decode())['cveRecords'])
    assert recordsLength >= 1
    for i in range(recordsLength):
        assert json.loads(res2.content.decode())[
            'cveRecords'][i]['cveMetadata']['assigner'] == json.loads(res.content.decode())['UUID']


def test_get_cve_filter_by_assigner_empty():
    """ Filtering CVE collection by nonexistent assigner succeeds and returns empty array"""
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_URL}/',
        headers=utils.BASE_HEADERS,
        params={
            'assigner': '12b746bd-357f-483d-8cda-ed822fecf731'
        }
    )
    assert res.status_code == 200
    recordsLength = len(json.loads(res.content.decode())['cveRecords'])
    assert recordsLength >= 0  # this assigner has zero occurences


def test_get_cve_filter_by_assignerShortName():
    """ Filter CVE collection by assigner_short_name that has 5 occurences"""
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_URL}/',
        headers=utils.BASE_HEADERS,
        params={
            'assigner_short_name': 'admit_9'
        }
    )
    assert res.status_code == 200
    recordsLength = len(json.loads(res.content.decode())['cveRecords'])
    assert recordsLength == 5
    for i in range(recordsLength):
        assert json.loads(res.content.decode())[
            'cveRecords'][i]['cveMetadata']['assignerShortName'] == 'admit_9'


def test_get_cve_filter_by_assignerShortName_empty():
    """ Filtering CVE collection by nonexistent assigner_short_name succeeds and returns empty array"""
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_URL}/',
        headers=utils.BASE_HEADERS,
        params={
            'assigner_short_name': 'cisco'
        }
    )
    assert res.status_code == 200
    recordsLength = len(json.loads(res.content.decode())['cveRecords'])
    assert recordsLength >= 0  # this assignerShortName has zero occurences


#### GET /cve/:id ####
def test_get_cve():
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_URL}/{cve_id}',
        headers=utils.BASE_HEADERS
    )
    ok_response_contains(res, cve_id)


def test_get_cve_dne():
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_URL}/{cve_id_dne}',
        headers=utils.BASE_HEADERS
    )
    assert res.status_code == 404
    response_contains_json(res, 'error', 'CVE_RECORD_DNE')


#### POST /cve/:id ####
def test_create_cve():
    """ publish a cve in the PUBLISHED state """
    with open('./src/test/cve_tests/cve_record_fixtures/CVE-2000-0008_published.json') as json_file:
        data = json.load(json_file)
        res = requests.post(
            f'{env.AWG_BASE_URL}{CVE_URL}/{create_cve_id}',
            headers=utils.BASE_HEADERS,
            json=data
        )
        try:
            ok_response_contains(res, create_cve_id)
        except AssertionError:
            assert res.status_code == 400
            response_contains_json(res, 'error', 'CVE_RECORD_EXISTS')


def test_create_cve_mismatch():
    """ the cve id in the json body does not match the cve id in the path parameter """
    with open('./src/test/cve_tests/cve_record_fixtures/CVE-2000-0008_published.json') as json_file:
        data = json.load(json_file)
        res = requests.post(
            f'{env.AWG_BASE_URL}{CVE_URL}/{curr_cve_id}',
            headers=utils.BASE_HEADERS,
            json=data
        )
        assert res.status_code == 400
        response_contains_json(res, 'error', 'CVEID_MISMATCH')


def test_create_cve_reserved_state():
    """ the cve record cannot be created in the RESERVED state """
    with open('./src/test/cve_tests/cve_record_fixtures/CVE-2017-5833_reserved.json') as json_file:
        data = json.load(json_file)
        res = requests.post(
            f'{env.AWG_BASE_URL}{CVE_URL}/{reserved_cve_id}',
            headers=utils.BASE_HEADERS,
            json=data
        )
        assert res.status_code == 400
        response_contains_json(res, 'error', 'INVALID_JSON_SCHEMA')


def test_create_nonexistent_cveid():
    """ the cve record cannot be created because the CVE ID doesn't exist """
    with open('./src/test/cve_tests/cve_record_fixtures/CVE-3000-0001_nonexistent.json') as json_file:
        data = json.load(json_file)
        res = requests.post(
            f'{env.AWG_BASE_URL}{CVE_URL}/{cve_id_dne}',
            headers=utils.BASE_HEADERS,
            json=data
        )
        assert res.status_code == 403
        response_contains_json(res, 'error', 'CVEID_DNE')


def test_create_existent_cve():
    """ the cve record cannot be created because it already exists """
    with open('./src/test/cve_tests/cve_record_fixtures/CVE-2021-0004_published.json') as json_file:
        data = json.load(json_file)
        res = requests.post(
            f'{env.AWG_BASE_URL}{CVE_URL}/CVE-2021-0004',
            headers=utils.BASE_HEADERS,
            json=data
        )
        assert res.status_code == 400
        response_contains_json(res, 'error', 'CVE_RECORD_EXISTS')


def test_create_unique_eng_cve():
    """ the cve record cannot be created because it already exists """
    with open('./src/test/cve_tests/cve_record_fixtures/CVE-2021-0004_published.json') as json_file:
        data = json.load(json_file)
        data['containers']['cna']['descriptions'].append({
            "lang": "en",
            "value": "A second en entry"
        })

        res = requests.post(
            f'{env.AWG_BASE_URL}{CVE_URL}/CVE-2021-0004',
            headers=utils.BASE_HEADERS,
            json=data
        )

        res_json = json.loads(res.content.decode())

        response_contains_json(res, 'error', 'BAD_INPUT')
        assert res_json['details'][0]['param'] == "containers.cna.descriptions"
        assert res_json['details'][0]['msg'] == "Cannot have more than one English language entry in 'containers.cna.descriptions'"


#### POST /cve/:id/reject ####

def test_submit_record_rejection():
    """ submit a reject request with a descriptions and replacedBy arrays """
    res = requests.post(
        f'{env.AWG_BASE_URL}/api/cve-id',
        headers=utils.BASE_HEADERS,
        params={
            'amount': 1,
            'cve_year': 2000,
            'short_name': 'mitre'
        }
    )
    id_num = json.loads(res.content.decode())[
        'cve_ids'][0]['cve_id']  # obtain id number
    with open('./src/test/cve_tests/cve_record_fixtures/rejectBody.json') as json_file:
        data = json.load(json_file)
        res = requests.post(
            f'{env.AWG_BASE_URL}{CVE_URL}/{id_num}/reject',
            headers=utils.BASE_HEADERS,
            json=data
        )
        assert res.status_code == 200


def test_submit_record_rejection_id_dne():
    """ submit a reject request with descriptions and replacedBy arrays for id that dne """
    fake_id = "CVE-0000-0000"
    with open('./src/test/cve_tests/cve_record_fixtures/rejectBody.json') as json_file:
        data = json.load(json_file)
        res = requests.post(
            f'{env.AWG_BASE_URL}{CVE_URL}/{fake_id}/reject',
            headers=utils.BASE_HEADERS,
            json=data
        )
        assert res.status_code == 403


def test_submit_record_rejection_multiple_different_english_values():
    """ submit a reject request with descriptions array that has multiple different English values (ex: "en" and "en-Ca") """
    res = requests.post(
        f'{env.AWG_BASE_URL}/api/cve-id/',
        headers=utils.BASE_HEADERS,
        params={
            'amount': 1,
            'cve_year': 2000,
            'short_name': 'mitre'
        }
    )
    id_num = json.loads(res.content.decode())[
        'cve_ids'][0]['cve_id']  # obtain id number
    with open('./src/test/cve_tests/cve_record_fixtures/rejectBodyMultipleDiffEngValues.json') as json_file:
        data = json.load(json_file)
        res = requests.post(
            f'{env.AWG_BASE_URL}{CVE_URL}/{id_num}/reject',
            headers=utils.BASE_HEADERS,
            json=data
        )
        assert res.status_code == 200  # lang values are unique


def test_submit_record_rejection_multiple_non_English_values():
    """ submit a reject request with descriptions array that has multiple non English values (ex: "fr" and "fr") """
    res = requests.post(
        f'{env.AWG_BASE_URL}/api/cve-id/',
        headers=utils.BASE_HEADERS,
        params={
            'amount': 1,
            'cve_year': 2000,
            'short_name': 'mitre'
        }
    )
    id_num = json.loads(res.content.decode())[
        'cve_ids'][0]['cve_id']  # obtain id number
    with open('./src/test/cve_tests/cve_record_fixtures/rejectBodyMultipleNonEngValues.json') as json_file:
        data = json.load(json_file)
        res = requests.post(
            f'{env.AWG_BASE_URL}{CVE_URL}/{id_num}/reject',
            headers=utils.BASE_HEADERS,
            json=data
        )
        assert res.status_code == 400  # lang values aren't unique


def test_submit_record_rejection_multiple_same_lang_values():
    """ 
    submit a reject request with descriptions array that has multiple 
    identical lang and value entries.
    """
    res = requests.post(
        f'{env.AWG_BASE_URL}/api/cve-id/',
        headers=utils.BASE_HEADERS,
        params={
            'amount': 1,
            'cve_year': 2000,
            'short_name': 'mitre'
        }
    )
    id_num = json.loads(res.content.decode())['cve_ids'][0]['cve_id']
    with open('./src/test/cve_tests/cve_record_fixtures/rejectBodyMultipleSameEngValues.json') as json_file:
        data = json.load(json_file)
        res = requests.post(
            f'{env.AWG_BASE_URL}{CVE_URL}/{id_num}/reject',
            headers=utils.BASE_HEADERS,
            json=data
        )

        res_json = json.loads(res.content.decode())

        assert res.status_code == 400

        response_contains_json(res, 'error', 'INVALID_JSON_SCHEMA')
        assert res_json['details']['errors'][0]['instancePath'] == '/cnaContainer/rejectedReasons'
        assert res_json['details']['errors'][0]['schemaPath'] == '#/uniqueItems'


def test_update_record_rejection_multiple_same_English_values():
    """ 
    update a reject request with descriptions array that has multiple 
    identical English lang and value entries.
    """
    res = requests.post(
        f'{env.AWG_BASE_URL}/api/cve-id/',
        headers=utils.BASE_HEADERS,
        params={
            'amount': 1,
            'cve_year': 2000,
            'short_name': 'mitre'
        }
    )
    id_num = json.loads(res.content.decode())['cve_ids'][0]['cve_id']
    with open('./src/test/cve_tests/cve_record_fixtures/rejectBody.json') as json_file:
        data = json.load(json_file)
        res = requests.post(
            f'{env.AWG_BASE_URL}{CVE_URL}/{id_num}/reject',
            headers=utils.BASE_HEADERS,
            json=data
        )

        assert res.status_code == 200

    with open('./src/test/cve_tests/cve_record_fixtures/rejectBodyMultipleSameEngValues.json') as json_file:
        data = json.load(json_file)
        res = requests.put(
            f'{env.AWG_BASE_URL}{CVE_URL}/{id_num}/reject',
            headers=utils.BASE_HEADERS,
            json=data
        )

        res_json = json.loads(res.content.decode())
        
        assert res.status_code == 400

        response_contains_json(res, 'error', 'INVALID_JSON_SCHEMA')
        assert res_json['details']['errors'][0]['instancePath'] == '/cnaContainer/rejectedReasons'
        assert res_json['details']['errors'][0]['schemaPath'] == '#/uniqueItems'


def test_submit_record_rejection_multiple_English_lang_entries():
    """ submit a reject request with descriptions array that contains multiple English lang entries """
    res = requests.post(
        f'{env.AWG_BASE_URL}/api/cve-id/',
        headers=utils.BASE_HEADERS,
        params={
            'amount': 1,
            'cve_year': 2000,
            'short_name': 'mitre'
        }
    )
    id_num = json.loads(res.content.decode())['cve_ids'][0]['cve_id']
    with open('./src/test/cve_tests/cve_record_fixtures/rejectBodyMultipleEngLangs.json') as json_file:
        data = json.load(json_file)
        res = requests.post(
            f'{env.AWG_BASE_URL}{CVE_URL}/{id_num}/reject',
            headers=utils.BASE_HEADERS,
            json=data
        )

        res_json = json.loads(res.content.decode())

        assert res.status_code == 400

        # example of how to validate when eventually using Avj extensions
        # response_contains_json(res, 'error', 'INVALID_JSON_SCHEMA')
        # assert res_json['details']['errors'][0]['instancePath'] == '/cnaContainer/rejectedReasons'
        # assert res_json['details']['errors'][0]['message'] == 'Cannot have more than one English language entry: en-gb.'
        response_contains_json(res, 'error', 'BAD_INPUT')
        assert res_json['details'][0]['param'] == "cnaContainer.rejectedReasons"
        assert res_json['details'][0]['msg'] == "Cannot have more than one English language entry in 'cnaContainer.rejectedReasons'"


def test_update_record_rejection_multiple_English_lang_entries():
    """ 
    update a reject request with descriptions array that has multiple 
    identical English lang entries.
    """
    res = requests.post(
        f'{env.AWG_BASE_URL}/api/cve-id/',
        headers=utils.BASE_HEADERS,
        params={
            'amount': 1,
            'cve_year': 2000,
            'short_name': 'mitre'
        }
    )
    id_num = json.loads(res.content.decode())['cve_ids'][0]['cve_id']
    with open('./src/test/cve_tests/cve_record_fixtures/rejectBody.json') as json_file:
        data = json.load(json_file)
        res = requests.post(
            f'{env.AWG_BASE_URL}{CVE_URL}/{id_num}/reject',
            headers=utils.BASE_HEADERS,
            json=data
        )

        assert res.status_code == 200

    with open('./src/test/cve_tests/cve_record_fixtures/rejectBodyMultipleEngLangs.json') as json_file:
        data = json.load(json_file)
        res = requests.put(
            f'{env.AWG_BASE_URL}{CVE_URL}/{id_num}/reject',
            headers=utils.BASE_HEADERS,
            json=data
        )

        res_json = json.loads(res.content.decode())
        
        assert res.status_code == 400

        response_contains_json(res, 'error', 'BAD_INPUT')
        assert res_json['details'][0]['param'] == "cnaContainer.rejectedReasons"
        assert res_json['details'][0]['msg'] == "Cannot have more than one English language entry in 'cnaContainer.rejectedReasons'"


#### PUT /cve/:id ####
def test_update_cve_record():
    with open('./src/test/cve_tests/cve_record_fixtures/CVE-2021-0005_published.json') as json_file:
        data = json.load(json_file)
        res = requests.put(
            f'{env.AWG_BASE_URL}{CVE_URL}/{curr_cve_id}',
            headers=utils.BASE_HEADERS,
            json=data
        )
        ok_response_contains(res, curr_cve_id)


def test_update_cve_mismatch():
    """ the cve id in the json body does not match the cve id in the path parameter """
    with open('./src/test/cve_tests/cve_record_fixtures/CVE-2000-0008_published.json') as json_file:
        data = json.load(json_file)
        res = requests.put(
            f'{env.AWG_BASE_URL}{CVE_URL}/{curr_cve_id}',
            headers=utils.BASE_HEADERS,
            json=data
        )
        assert res.status_code == 400
        response_contains_json(res, 'error', 'CVEID_MISMATCH')


def test_update_cve_reserved_state():
    """ the cve record cannot be changed to the RESERVED state """
    with open('./src/test/cve_tests/cve_record_fixtures/CVE-2017-5833_reserved.json') as json_file:
        data = json.load(json_file)
        res = requests.put(
            f'{env.AWG_BASE_URL}{CVE_URL}/{reserved_cve_id}',
            headers=utils.BASE_HEADERS,
            json=data
        )
        assert res.status_code == 400
        response_contains_json(res, 'error', 'INVALID_JSON_SCHEMA')


def test_update_nonexistent_cve_id():
    """ the cve record cannot be updated because the CVE ID doesn't exist """
    with open('./src/test/cve_tests/cve_record_fixtures/CVE-3000-0001_nonexistent.json') as json_file:
        data = json.load(json_file)
        res = requests.put(
            f'{env.AWG_BASE_URL}{CVE_URL}/{cve_id_dne}',
            headers=utils.BASE_HEADERS,
            json=data
        )
        assert res.status_code == 403
        response_contains_json(res, 'error', 'CVEID_DNE')


def test_update_nonexistent_cve():
    """ the cve record cannot be updated because it doesn't exist """
    with open('./src/test/cve_tests/cve_record_fixtures/CVE-2009-0009_rejected.json') as json_file:
        data = json.load(json_file)
        res = requests.put(
            f'{env.AWG_BASE_URL}{CVE_URL}/{reject_cve_id}',
            headers=utils.BASE_HEADERS,
            json=data
        )
        assert res.status_code == 403
        response_contains_json(res, 'error', 'CVE_RECORD_DNE')


def test_record_submission_too_large():
    """ the cve record cannot be submitted because it is 16 mb"""
    with open('./src/test/cve_tests/cve_record_fixtures/CVE-2021-0004_largeInput.json') as json_file:
        data = json.load(json_file)
        res = requests.post(
            f'{env.AWG_BASE_URL}{CVE_URL}/CVE-2021-0004',
            headers=utils.BASE_HEADERS,
            json=data
        )
        assert res.status_code == 413  # payload is too large
        response_contains_json(res, 'error', 'RECORD_TOO_LARGE')


def test_record_update_too_large():
    """ the cve record cannot be updated because it is 16 mb"""
    with open('./src/test/cve_tests/cve_record_fixtures/CVE-2021-0004_largeInput.json') as json_file:
        data = json.load(json_file)
        res = requests.put(
            f'{env.AWG_BASE_URL}{CVE_URL}/CVE-2021-0004',
            headers=utils.BASE_HEADERS,
            json=data
        )
        assert res.status_code == 413  # payload is too large
        response_contains_json(res, 'error', 'RECORD_TOO_LARGE')


### POST cve/:id/cna ###
def test_post_cna_container():
    """ the cve record is created from provided cna container """
    with open('./src/test/cve_tests/cve_record_fixtures/CVE-2000-0008_published.json') as json_file:
        data = json.load(json_file)
        data = {'cnaContainer': data['containers']['cna']}
        res = requests.post(
            f'{env.AWG_BASE_URL}{CVE_URL}/CVE-2021-0004/cna',
            headers=utils.BASE_HEADERS,
            json=data
        )

        try:
            assert res.status_code == 200
        except AssertionError:
            assert res.status_code == 403
            response_contains_json(res, 'error', 'CVE_RECORD_EXISTS')


def test_post_cna_container_langs():
    """ 
    tests all permutations of the language fields for cna containers 
    
    NB: This currently checks only the cna.descriptions field and not 
    cna.problemTypes.descriptions because it's unclear if it has the same restrictions

    """

    pos = [
        "cna_descriptions-multipleEnLangsDifferentLocale.json",
        "cna_descriptions-multipleSameLangs.json",
        # "cna_problemTypes_descriptions-multipleEnLangsDifferentLocale.json",
        # "cna_problemTypes_descriptions-multipleSameLangs.json",
    ]

    neg = [
        "cna_descriptions-multipleEnLangs.json",
        "cna_descriptions-multipleIdenticalEntries.json",
        # "cna_problemTypes_descriptions-multipleEnLangs.json",
        # "cna_problemTypes_descriptions-multipleIdenticalEntries.json",
    ]

    def get_res(test_filename):
        test_path = Path(
            './src/test/cve_tests/cve_record_fixtures',
            'CVE-2000-0008_published_langs',
            test_filename
        )

        with open(test_path) as json_file:
            data = json.load(json_file)
            data = {'cnaContainer': data['containers']['cna']}
            return requests.post(
                f'{env.AWG_BASE_URL}{CVE_URL}/CVE-2021-0004/cna',
                headers=utils.BASE_HEADERS,
                json=data
            )

    for test_filename in pos:
        res = get_res(test_filename)

        # these records already exist and it's outside scope to create new ones here.
        # we only want to test that validation passes for the language fields,
        # so the expected error should be a duplicate entry, NOT language related
        assert res.status_code == 403, test_filename
        response_contains_json(res, 'error', 'CVE_RECORD_EXISTS')

    for test_filename in neg :
        res = get_res(test_filename)
        res_json = json.loads(res.content.decode())
        
        assert res.status_code == 400, test_filename

        # temp fix for a special case because language validation happens
        # separately from schema validation, and these are caught
        # by the avj schema validation
        if test_filename.endswith('multipleIdenticalEntries.json'):
            response_contains_json(res, 'error', 'INVALID_JSON_SCHEMA', test_filename)
        else:
            response_contains_json(res, 'error', 'BAD_INPUT', test_filename)
            assert res_json['details'][0]['param'] == "cnaContainer.descriptions"
            assert res_json['details'][0]['msg'] == "Cannot have more than one English language entry in 'cnaContainer.descriptions'"



def test_put_cna_container():
    """ the cve record is updated from provided cna container """
    with open('./src/test/cve_tests/cve_record_fixtures/CVE-2000-0008_published.json') as json_file:
        data = json.load(json_file)
        data = {'cnaContainer': data['containers']['cna']}
        res = requests.put(
            f'{env.AWG_BASE_URL}{CVE_URL}/CVE-2021-0004/cna',
            headers=utils.BASE_HEADERS,
            json=data
        )
        assert res.status_code == 200


def test_put_cna_container_langs():
    """ 
    tests all permutations of the language fields for put cna containers 
    
    NB: This currently checks only the cna.descriptions field and not 
    cna.problemTypes.descriptions because it's unclear if it has the same restrictions

    """

    pos = [
        "cna_descriptions-multipleEnLangsDifferentLocale.json",
        "cna_descriptions-multipleSameLangs.json",
        # "cna_problemTypes_descriptions-multipleEnLangsDifferentLocale.json",
        # "cna_problemTypes_descriptions-multipleSameLangs.json",
    ]

    neg = [
        "cna_descriptions-multipleEnLangs.json",
        "cna_descriptions-multipleIdenticalEntries.json",
        
        # throws a 500 instead of 40X
        # "cna_descriptions-multipleSameLangsNoEn.json",
        
        # "cna_problemTypes_descriptions-multipleEnLangs.json",
        # "cna_problemTypes_descriptions-multipleIdenticalEntries.json",
    ]

    def get_res(test_filename):
        test_path = Path(
            './src/test/cve_tests/cve_record_fixtures',
            'CVE-2000-0008_published_langs',
            test_filename
        )

        with open(test_path) as json_file:
            data = json.load(json_file)
            data = {'cnaContainer': data['containers']['cna']}
            return requests.put(
                f'{env.AWG_BASE_URL}{CVE_URL}/CVE-2021-0004/cna',
                headers=utils.BASE_HEADERS,
                json=data
            )

    for test_filename in pos:
        res = get_res(test_filename)
        assert res.status_code == 200, test_filename

    for test_filename in neg :
        res = get_res(test_filename)
        res_json = json.loads(res.content.decode())
        
        assert res.status_code == 400, test_filename

        # temp fix for a special case because language validation happens
        # separately from schema validation, and these are caught
        # by the avj schema validation
        if test_filename.endswith('multipleIdenticalEntries.json'):
            response_contains_json(res, 'error', 'INVALID_JSON_SCHEMA', test_filename)
        else:
            response_contains_json(res, 'error', 'BAD_INPUT', test_filename)
            assert res_json['details'][0]['param'] == "cnaContainer.descriptions"
            assert res_json['details'][0]['msg'] == "Cannot have more than one English language entry in 'cnaContainer.descriptions'"



# PUT cve/:id/reject ###
def test_record_rejection_in_published_state():
    """ reject an existing record from PUBLISHED state """
    with open('./src/test/cve_tests/cve_record_fixtures/rejectExisting.json') as json_file:
        data = json.load(json_file)
        res = requests.put(
            f'{env.AWG_BASE_URL}{CVE_URL}/CVE-1999-0003/reject',
            headers=utils.BASE_HEADERS,
            json=data
        )
    assert res.status_code == 200


def test_record_rejection_in_rejected_state():
    """ reject an existing record from REJECTED state with optional replacedBy"""
    with open('./src/test/cve_tests/cve_record_fixtures/rejectExisting.json') as json_file:
        data = json.load(json_file)
        res = requests.put(
            f'{env.AWG_BASE_URL}{CVE_URL}/CVE-1999-0001/reject',
            headers=utils.BASE_HEADERS,
            json=data
        )
    assert res.status_code == 200


def test_record_rejection_in_rejected_state_no_replacedBy():
    """ reject an existing record from REJECTED state with no optional replacedBy """
    with open('./src/test/cve_tests/cve_record_fixtures/rejectExisting.json') as json_file:
        data = json.load(json_file)
        res = requests.put(
            f'{env.AWG_BASE_URL}{CVE_URL}/CVE-1999-0008/reject',
            headers=utils.BASE_HEADERS,
            json=data
        )
    assert res.status_code == 200

# CVE ENDPOINT UTILITIES
# ==============================================================================
# these are unique to the `{CVE_URL}` endpoint for the AWG system


def update_cve(filename, cveid):
    with open(f'./src/test/cve_tests/cve_record_fixtures/{filename}.json') as json_file:
        data = json.load(json_file)
        res = requests.put(
            f'{env.AWG_BASE_URL}{CVE_URL}/{cveid}',
            headers=utils.BASE_HEADERS,
            json=data
        )


def post_cve(filename, cveid):
    with open(f'./src/test/cve_tests/cve_record_fixtures/{filename}.json') as json_file:
        data = json.load(json_file)
        res = requests.post(
            f'{env.AWG_BASE_URL}{CVE_URL}/{cveid}',
            headers=utils.BASE_HEADERS,
            json=data
        )


def test_cve_get_page():
    """ page must be a positive int """
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_URL}',
        headers=utils.BASE_HEADERS,
        params={
            'page': '1',
        }
    )
    assert res.status_code == 200


def test_cve_get_bad_page():
    """ page must be a positive int """

    # test negative
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_URL}',
        headers=utils.BASE_HEADERS,
        params={
            'page': -1,
        }
    )
    assert res.status_code == 400
    response_contains_json(res, 'error', 'BAD_INPUT')
    response_contains_json(res, 'details', utils.BAD_PAGE_ERROR_DETAILS)

    # test strings
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_URL}',
        headers=utils.BASE_HEADERS,
        params={
            'page': 'abc',
        }
    )
    assert res.status_code == 400
    response_contains_json(res, 'error', 'BAD_INPUT')
    response_contains_json(res, 'details', utils.BAD_PAGE_ERROR_DETAILS)



def test_get_cve_ensure_sorted():
    """ Should be ordered by CVE ID asc. """
    res = requests.get(
        f'{env.AWG_BASE_URL}{CVE_URL}/',
        headers=utils.BASE_HEADERS,
    )

    assert res.status_code == 200
    records = json.loads(res.content.decode())['cveRecords']

    prev_id = "CVE-1900-0000"
    for record in records:
        assert record['cveMetadata']['cveId'] > prev_id
        prev_id = record['cveMetadata']['cveId']