# Tests in this file use the secretariat credentials and exercise the org
# endpoint as defined by ORG_URL. This endpoint includes Org and User
# functionality, if it becomes unwieldy it should be broken down between Org-
# and User-focused tests.
import copy
import json
import random
import requests
import uuid
from src import env, utils
from src.utils import (assert_contains, ok_response_contains,
                       ok_response_contains_json, response_contains,
                       response_contains_json)

ORG_URL = '/api/org'
MAX_SHORTNAME_LENGTH = 32
#### GET /org ####


def test_get_all_orgs():
    """ secretariat users can request a list of all organizations """
    res = requests.get(
        f'{env.AWG_BASE_URL}{ORG_URL}',
        headers=utils.BASE_HEADERS
    )
    ok_response_contains(res, '"active_roles":["SECRETARIAT","CNA"]')
    assert len(json.loads(res.content.decode())['organizations']) >= 1


#### GET /org/:identifier ####
def test_get_mitre_cna():
    """ the cve services api contains the mitre cna """
    res = requests.get(
        f'{env.AWG_BASE_URL}{ORG_URL}/mitre',
        headers=utils.BASE_HEADERS
    )
    ok_response_contains(res, 'SECRETARIAT')
    ok_response_contains_json(res, 'name', 'MITRE Corporation')
    ok_response_contains_json(res, 'short_name', 'mitre')


#### GET /org/:identifier ####
def test_get_mitre_by_org_uuid():
    """ look up org info by org uuid"""
    #  Look up an org to obtain uuid
    res = requests.get(
        f'{env.AWG_BASE_URL}{ORG_URL}/mitre',
        headers=utils.BASE_HEADERS
    )
    ok_response_contains_json(res, 'short_name', 'mitre')
    # obtain the org uuid to filter by
    uuid = json.loads(res.content.decode())['UUID']

    #  Look up org info by the org uuid found above
    res2 = requests.get(
        f'{env.AWG_BASE_URL}{ORG_URL}/{uuid}',
        headers=utils.BASE_HEADERS,
    )
    ok_response_contains(res2, 'SECRETARIAT')
    ok_response_contains_json(res2, 'name', 'MITRE Corporation')
    ok_response_contains_json(
        res2, 'UUID', json.loads(res.content.decode())['UUID'])


#### GET /org/:identifier ####
def test_get_mitre_by_nonexistent_org_uuid():
    """ look up org info by org uuid that cannot be found"""
    uuid = 'nonexistent123'
    res = requests.get(
        f'{env.AWG_BASE_URL}{ORG_URL}/{uuid}',
        headers=utils.BASE_HEADERS,
    )
    assert res.status_code == 404
    response_contains_json(res, 'error', 'ORG_DNE_PARAM')


#### GET /org/:shortname/id_quota ####
def test_get_mitre_id_quota():
    """ the cve services api's mitre cna has a valid id quota """
    res = get_org_id_data('mitre')
    ok_response_contains(res, 'id_quota')

    body = json.loads(res.content.decode())
    quota = body['id_quota']
    available = body['available']
    reserved = body['total_reserved']

    assert quota >= 0
    assert available >= 0
    assert reserved >= 0

    assert quota <= 100000
    assert quota == available + reserved


#### PUT /org/:shortname ####
def test_update_mitre_id_quota():
    """ a secretariat user can update its own ID quota """
    # NOTE: this test makes sure MITRE can reserve IDs for reservation tests
    res = requests.put(
        f'{env.AWG_BASE_URL}{ORG_URL}/mitre?id_quota=100000',
        headers=utils.BASE_HEADERS)
    assert res.status_code == 200
    response_contains_json(
        res, 'message',
        'mitre organization was successfully updated.')


#### GET /org/:shortname/user/:username ####
def test_get_mitre_demon_user():
    """ the user we're ... using, exists under the mitre cna """
    # although this is a bit tautological, it still exercises the endpoint
    res = requests.get(
        f'{env.AWG_BASE_URL}{ORG_URL}/mitre/user/{env.AWG_USER_NAME}',
        headers=utils.BASE_HEADERS
    )
    ok_response_contains_json(res, 'username', env.AWG_USER_NAME)
    ok_response_contains_json(res, 'active', True)


#### POST /org ####
def test_post_new_org_empty_body():
    """ an empty new org body is invalid for name and short name """
    res = requests.post(
        f'{env.AWG_BASE_URL}{ORG_URL}',
        headers=utils.BASE_HEADERS,
        json={}
    )
    assert res.status_code == 400
    assert 'name' in res.content.decode()
    assert 'short_name' in res.content.decode()
    # One error for each reason 'name' and 'short_name' is invalid. 5
    assert len(json.loads(res.content.decode())['details']) == 5
    response_contains_json(res, 'message', 'Parameters were invalid')


def test_post_new_org_empty_params():
    """ empty new org name and short name parameters is a bad request """
    res = requests.post(
        f'{env.AWG_BASE_URL}{ORG_URL}',
        headers=utils.BASE_HEADERS,
        json={
            'name': '',
            'short_name': ''
        }
    )
    assert res.status_code == 400
    assert 'name' in res.content.decode()
    assert 'short_name' in res.content.decode()
    assert len(json.loads(res.content.decode())['details']) == 3
    response_contains_json(res, 'message', 'Parameters were invalid')


def test_post_new_org_already_exists():
    """ cve services org endpoint rejects duplicate org creation """
    res = requests.post(
        f'{env.AWG_BASE_URL}{ORG_URL}',
        headers=utils.BASE_HEADERS,
        json={
            'name': 'MITRE Corporation',
            'short_name': 'mitre'
        }
    )
    assert res.status_code == 400
    response_contains_json(
        res, 'message', "The \'mitre\' organization already exists.")


def test_post_new_org():
    """ cve services new org endpoint works for unique data """
    uid = str(uuid.uuid4())[:MAX_SHORTNAME_LENGTH]
    quota = random.randint(0, 100000)
    res = post_new_org(uid, uid, quota)
    ok_response_contains(res, f'{uid} organization was successfully created')


def test_post_new_org_duplicate_parameter():
    """ cve services new org endpoint rejects duplicate parameter requests """
    uid = str(uuid.uuid4())[:MAX_SHORTNAME_LENGTH]
    res = requests.post(
        f'{env.AWG_BASE_URL}{ORG_URL}',
        headers=utils.BASE_HEADERS,
        json={
            'short_name': uid,
            'short_name': uid
        }
    )

    # NOTE: this isn't any different from the missing parameters case
    # but maybe it should be, if the services could be updated to return
    # more meaningful error responses
    assert res.status_code == 400
    assert 'name' in res.content.decode()
    assert 'short_name' not in res.content.decode()
    assert len(json.loads(res.content.decode())['details']) == 2
    response_contains_json(res, 'message', 'Parameters were invalid')


def test_post_new_org_uuid_parameter():
    """ should reject creating new orgs with uuid param """
    uid = str(uuid.uuid4())[:MAX_SHORTNAME_LENGTH]
    res = requests.post(
        f'{env.AWG_BASE_URL}{ORG_URL}',
        headers=utils.BASE_HEADERS,
        json={
            'short_name': uid,
            'name': uid,
            'uuid': str(uuid.uuid4())
        }
    )

    json_content = json.loads(res.content.decode())
    assert res.status_code == 400
    assert 'error' in json_content
    assert json_content['error'] == 'UUID_PROVIDED'
    assert 'message' in json_content
    response_contains_json(res, 'message', 'Providing UUIDs for org creation or update is not allowed.')

    # check that it didn't actually create the org:
    # https://github.com/CVEProject/cve-services/issues/887
    res = requests.get(
        f'{env.AWG_BASE_URL}{ORG_URL}/{uid}',
        headers=utils.BASE_HEADERS
    )

    assert res.status_code == 404


#### POST /org/:shortname/user ####
def test_post_new_org_user():
    """ secretariat user can create a new user without active roles """
    uid = str(uuid.uuid4())[:MAX_SHORTNAME_LENGTH]
    res = post_new_org_user('mitre', uid)
    assert res.status_code == 200
    response_contains_json(res, 'message', f'{uid} was successfully created.')


def test_post_new_org_bad_role_blarg():
    """ service creates user in spite of erroneous data in body """
    uid = str(uuid.uuid4())[:MAX_SHORTNAME_LENGTH]
    res = requests.post(
        f'{env.AWG_BASE_URL}{ORG_URL}/mitre/user',
        headers=utils.BASE_HEADERS,
        json={
            'username': uid,
            'ubiquitous': 'mendacious'
        }
    )
    assert res.status_code == 200
    response_contains_json(res, 'message', f'{uid} was successfully created.')


def test_post_new_org_user_empty_body():
    """ an empty new org user body is invalid for username """
    res = requests.post(
        f'{env.AWG_BASE_URL}{ORG_URL}/mitre/user',
        headers=utils.BASE_HEADERS,
        json={}
    )
    assert res.status_code == 400
    assert 'username' in res.content.decode()
    assert len(json.loads(res.content.decode())['details']) == 3
    response_contains_json(res, 'message', 'Parameters were invalid')


def test_post_new_org_user_empty_params():
    """ an empty new org user parameters is invalid for username """
    res = requests.post(
        f'{env.AWG_BASE_URL}{ORG_URL}/mitre/user',
        headers=utils.BASE_HEADERS,
        json={'username': ''}
    )
    assert res.status_code == 400
    assert 'username' in res.content.decode()
    assert len(json.loads(res.content.decode())['details']) == 2
    response_contains_json(res, 'message', 'Parameters were invalid')


def test_post_new_org_user_duplicate():
    """ cve services new org user endpoint fails for a duplicate user """
    res = requests.post(
        f'{env.AWG_BASE_URL}{ORG_URL}/mitre/user',
        headers=utils.BASE_HEADERS,
        json={'username': env.AWG_USER_NAME}
    )
    assert res.status_code == 400
    response_contains_json(
        res, 'message',
        f"The user \'{env.AWG_USER_NAME}\' already exists.")


#### PUT /org/:shortname ####
def test_put_update_org_that_does_not_exist():
    """ cve services api will not update orgs that don't exist """
    uid = 'nonexistant_org'
    res = requests.put(
        f'{env.AWG_BASE_URL}{ORG_URL}/{uid}?id_quota=100',
        headers=utils.BASE_HEADERS
    )
    assert res.status_code == 404
    response_contains_json(res, 'error', 'ORG_DNE_PARAM')
    assert_contains(res, 'by the shortname parameter does not exist')


def test_put_update_mitre_org_nonexistent_user():
    """ cve services api will fail requests from users that don't exist """
    uid = str(uuid.uuid4())[:MAX_SHORTNAME_LENGTH]
    tmp = copy.deepcopy(utils.BASE_HEADERS)
    tmp['CVE-API-ORG'] = uid
    tmp['CVE-API-USER'] = uid
    res = requests.get(
        f'{env.AWG_BASE_URL}{ORG_URL}/mitre',
        headers=tmp
    )
    assert res.status_code == 401
    assert res.reason == 'Unauthorized'
    response_contains_json(res, 'error', 'UNAUTHORIZED')
    response_contains_json(res, 'message', 'Unauthorized')


#### PUT /org/:shortname/user/:username ####
def test_put_update_user_username():
    """ services api allows user usernames to be updated by secretariat """
    org, user = create_new_user_with_new_org_by_uuid()
    new_user_uid = str(uuid.uuid4())

    # finally, we can update that user
    res = requests.put(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}',
        headers=utils.BASE_HEADERS,
        params={'new_username': new_user_uid}
    )
    assert res.status_code == 200
    response_contains_json(res, 'message', f'{user} was successfully updated.')

    # we can't try again because the user doesn't exist anymore
    res = requests.put(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}',
        headers=utils.BASE_HEADERS,
        params={'new_username': new_user_uid}
    )
    assert res.status_code == 404
    response_contains(
        res, 'designated by the username parameter does not exist.')
    response_contains_json(res, 'error', 'USER_DNE')


def test_put_update_user_org_short_name():
    """ services api allows users org to be updated by secretariat """
    org, user = create_new_user_with_new_org_by_uuid()
    new_org = 'new_org_name'
    new_org_res = post_new_org(new_org, new_org)
    assert new_org_res.status_code == 200

    res = requests.put(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}',
        headers=utils.BASE_HEADERS,
        params={'org_short_name': new_org}
    )
    assert res.status_code == 200
    response_contains_json(res, 'message', f'{user} was successfully updated.')

    # user doesn't exist at this endpoint because its under a new org
    res = requests.put(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}',
        headers=utils.BASE_HEADERS,
        params={'org_short_name': new_org}
    )
    assert res.status_code == 404
    response_contains(
        res, 'designated by the username parameter does not exist.')
    response_contains_json(res, 'error', 'USER_DNE')

    # but we can get the new user
    res = requests.get(
        f'{env.AWG_BASE_URL}{ORG_URL}/{new_org}/user/{user}',
        headers=utils.BASE_HEADERS
    )
    ok_response_contains(res, user)


def test_put_update_user_personal_info():
    """ services api allows user personal info to be updated by secretariat """
    org, user = create_new_user_with_new_org_by_uuid()
    name_uid = str(uuid.uuid4())
    res = requests.put(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}',
        headers=utils.BASE_HEADERS,
        params={
            'name.first': name_uid,
            'name.last': name_uid,
            'name.middle': name_uid,
            'name.suffix': name_uid,
        }
    )
    assert res.status_code == 200
    assert_contains(res, name_uid, count=4)


def test_put_update_user_add_admin_role():
    """ services api allows user active roles to be updated by secretariat """
    org, user = create_new_user_with_new_org_by_uuid()
    res = requests.put(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}',
        headers=utils.BASE_HEADERS,
        params={'active_roles.add': 'ADMIN'}
    )
    assert res.status_code == 200
    response_contains_json(res, 'message', f'{user} was successfully updated.')
    assert json.loads(res.content.decode())['updated']['authority'] == {
        'active_roles': ['ADMIN']}


def test_put_update_user_add_empty_role():
    """ services api rejects request to add roles that do not exist """
    org, user = create_new_user_with_new_org_by_uuid()
    res = requests.put(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}',
        headers=utils.BASE_HEADERS,
        params={'active_roles.add': 'MAGNANIMOUS'}
    )
    assert res.status_code == 400
    assert 'MAGNANIMOUS' not in res.content.decode()
    response_contains_json(res, 'error', 'BAD_INPUT')
    response_contains_json(res, 'message', 'Parameters were invalid')
    response_contains(res, 'User role does not exist.')


def test_put_update_user_remove_admin_role():
    """ services api allows user active roles to be updated by secretariat """
    org, user = create_new_user_with_new_org_by_uuid()
    res = requests.put(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}',
        headers=utils.BASE_HEADERS,
        params={'active_roles.add': 'ADMIN'}
    )
    assert res.status_code == 200
    res = requests.put(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}',
        headers=utils.BASE_HEADERS,
        params={'active_roles.remove': 'ADMIN'}
    )
    assert res.status_code == 200
    response_contains_json(res, 'message', f'{user} was successfully updated.')
    assert json.loads(res.content.decode())[
        'updated']['authority'] == {'active_roles': []}


def test_put_update_user_remove_admin_role():
    """ services api rejects requests to remove user roles that don't exist """
    org, user = create_new_user_with_new_org_by_uuid()

    res = requests.put(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}',
        headers=utils.BASE_HEADERS,
        params={'active_roles.add': 'ADMIN'}
    )
    assert res.status_code == 200

    res = requests.put(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}',
        headers=utils.BASE_HEADERS,
        params={'active_roles.remove': 'FELLOE'}
    )
    assert res.status_code == 400
    assert 'FELLOE' not in res.content.decode()
    response_contains_json(res, 'error', 'BAD_INPUT')
    response_contains_json(res, 'message', 'Parameters were invalid')
    response_contains(res, 'User role does not exist.')


#### PUT /org/:shortname/user/:username/reset_secret ####
def test_put_update_user_reset_secret():
    """ services api allows the secretariat to reset user secrets """
    org, user = create_new_user_with_new_org_by_uuid()
    res = requests.put(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}/reset_secret',
        headers=utils.BASE_HEADERS
    )
    assert res.status_code == 200
    response_contains(res, 'API-secret')


# ORG ENDPOINT UTILITIES
# ==============================================================================
# these are unique to the `{ORG_URL}` endpoint for the AWG system


def get_org(cna_short_name):
    return requests.get(
        f'{env.AWG_BASE_URL}{ORG_URL}/{cna_short_name}',
        headers=utils.BASE_HEADERS
    )


def get_org_id_data(cna_short_name):
    return requests.get(
        f'{env.AWG_BASE_URL}{ORG_URL}/{cna_short_name}/id_quota',
        headers=utils.BASE_HEADERS
    )


def post_new_org(name, short_name, id_quota=1000, is_secretariat=False):
    """ create an organization with the services api """
    roles = ['CNA']
    if is_secretariat:
        roles = ['SECRETARIAT'] + roles
    return requests.post(
        f'{env.AWG_BASE_URL}{ORG_URL}',
        headers=utils.BASE_HEADERS,
        json={
            'name': name,
            'short_name': short_name,
            'authority': {'active_roles': roles},
            'policies': {'id_quota': id_quota}
        }
    )


def post_new_org_user(org_short_name, user_name):
    """ create a user for the organization defined by its short name """
    return requests.post(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org_short_name}/user',
        headers=utils.BASE_HEADERS,
        json={'username': user_name}
    )


def create_new_user_with_new_org_by_shortname(org_short_name, user_name):
    """ create an organization, and a user under that org """
    org_res = post_new_org(org_short_name, org_short_name)
    assert org_res.status_code == 200
    user_res = post_new_org_user(org_short_name, user_name)
    assert user_res.status_code == 200
    return org_short_name, user_name


def create_new_user_with_new_org_by_uuid():
    """ create an organization, and a user under that org, using uuid """
    user_name = str(uuid.uuid4())
    org_short_name = str(uuid.uuid4())[:MAX_SHORTNAME_LENGTH]

    org_res = post_new_org(org_short_name, org_short_name)
    assert org_res.status_code == 200
    user_res = post_new_org_user(org_short_name, user_name)
    assert user_res.status_code == 200

    return org_short_name, user_name
