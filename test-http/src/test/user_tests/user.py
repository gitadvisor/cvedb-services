# Tests in this file use the secretariat credentials
import requests
import json
import random
import string
from src import env, utils
from src.utils import (assert_contains, ok_response_contains,
                       ok_response_contains_json, response_contains,
                       response_contains_json)

#### GET /users ####
def test_get_all_users():
    """ secretariat users can request a list of all users """
    res = requests.get(
        f'{env.AWG_BASE_URL}/api/users',
        headers=utils.BASE_HEADERS
    )

    test_user={}
    for user in json.loads(res.content.decode())['users']:
        if user['username'] == 'cps@mitre.org':
            test_user = user
            break
    assert test_user['username'] == 'cps@mitre.org'
    assert test_user['name']['first'] == 'Jeremy'
    assert '"secret"' not in res.content.decode() # check that no secrets are included
    assert res.status_code == 200

#### GET /users ####
def test_regular_users_cannot_get_all_users(reg_user_headers):
    """ regular users cannot request a list of all users """
    res = requests.get(
        f'{env.AWG_BASE_URL}/api/users',
        headers=reg_user_headers
    )
    assert res.status_code == 403
    response_contains_json(res, 'error', 'SECRETARIAT_ONLY')


#### GET /users ####
def test_org_admins_cannot_get_all_users(org_admin_headers):
    """ org admins cannot request a list of all users """
    res = requests.get(
        f'{env.AWG_BASE_URL}/api/users',
        headers=org_admin_headers
    )
    assert res.status_code == 403
    response_contains_json(res, 'error', 'SECRETARIAT_ONLY')


def test_get_user_page():
    """ page must be a positive int """
    res = requests.get(
        f'{env.AWG_BASE_URL}/api/users',
        headers=utils.BASE_HEADERS,
        params={
            'page': '1',
        }
    )
    assert res.status_code == 200


def test_get_bad_user_page():
    """ page must be a positive int """

    # test negative
    res = requests.get(
        f'{env.AWG_BASE_URL}/api/users',
        headers=utils.BASE_HEADERS,
        params={
            'page': '-1',
        }
    )
    assert res.status_code == 400
    response_contains_json(res, 'error', 'BAD_INPUT')
    response_contains_json(res, 'details', utils.BAD_PAGE_ERROR_DETAILS)

    # test strings
    res = requests.get(
        f'{env.AWG_BASE_URL}/api/users',
        headers=utils.BASE_HEADERS,
        params={
            'page': 'abc',
        }
    )
    assert res.status_code == 400
    response_contains_json(res, 'error', 'BAD_INPUT')
    response_contains_json(res, 'details', utils.BAD_PAGE_ERROR_DETAILS)

def test_put_user_update_name():
    """ correct error is returned when updating user to same org """

    # grab all users to find one to update
    res = requests.get(
        f'{env.AWG_BASE_URL}/api/users',
        headers=utils.BASE_HEADERS
    )

    assert res.status_code == 200
    all_users = json.loads(res.content.decode())['users']

    assert len(all_users) > 0

    test_user = all_users[0]

    # can only use the org shortname in the URL
    org_res = requests.get(
        f'{env.AWG_BASE_URL}/api/org/{test_user["org_UUID"]}',
        headers=utils.BASE_HEADERS
    )

    assert org_res.status_code == 200
    org = json.loads(org_res.content.decode())

    # random string for test name
    test_name = ''.join(random.choices(string.ascii_letters, k=16))

    res = requests.put(
        f'{env.AWG_BASE_URL}/api/org/{org["short_name"]}/user/{test_user["username"]}',
        headers=utils.BASE_HEADERS,
        params={
            'name.first': test_name
        }
    )

    assert res.status_code == 200

    res = requests.get(
        f'{env.AWG_BASE_URL}/api/org/{org["short_name"]}/user/{test_user["username"]}',
        headers=utils.BASE_HEADERS
    )

    assert json.loads(res.content.decode())['name']['first'] == test_name

    # put the name back to what it was because tests don't reset the data

    res = requests.put(
        f'{env.AWG_BASE_URL}/api/org/{org["short_name"]}/user/{test_user["username"]}',
        headers=utils.BASE_HEADERS,
        params={
            'name.first': test_user['name']['first']
        }
    )

    assert res.status_code == 200



def test_put_user_error_for_same_org():
    """ correct error is returned when updating user to same org """

    # grab all users to find one to update
    res = requests.get(
        f'{env.AWG_BASE_URL}/api/users',
        headers=utils.BASE_HEADERS
    )

    assert res.status_code == 200
    all_users = json.loads(res.content.decode())['users']

    assert len(all_users) > 0

    # try to update user to same org
    test_user = all_users[0]

    # can only use the org shortname in the URL
    org_res = requests.get(
        f'{env.AWG_BASE_URL}/api/org/{test_user["org_UUID"]}',
        headers=utils.BASE_HEADERS
    )

    assert org_res.status_code == 200
    org = json.loads(org_res.content.decode())

    res = requests.put(
        f'{env.AWG_BASE_URL}/api/org/{org["short_name"]}/user/{test_user["username"]}',
        headers=utils.BASE_HEADERS,
        params={
            'org_short_name': org['short_name']
        }
    )

    assert res.status_code == 403
    err = json.loads(res.content.decode())

    assert err['error'] == 'USER_ALREADY_IN_ORG'
    assert err['message'] == f'The user could not be updated because the user \'{test_user["username"]}\' already belongs to the \'{org["short_name"]}\' organization.'
