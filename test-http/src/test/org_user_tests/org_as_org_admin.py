# Tests in this file use an Org admin user provided by a Pytest fixture. The
# tests here should be a subset of the secretariat tests, since the CNA of last
# resort should always be able to perform any root CNA functionality in
# addition to functionality reserved for the CNA of last resort.
import json
import requests
import uuid
from src import env, utils
from src.test.org_user_tests.org import (ORG_URL, create_new_user_with_new_org_by_uuid,
                                         create_new_user_with_new_org_by_shortname,
                                         post_new_org_user, post_new_org)
from src.utils import response_contains, response_contains_json

MAX_SHORTNAME_LENGTH = 32

### GET /org ####


def test_org_admin_get_all_orgs(org_admin_headers):
    """ services api rejects requests for all orgs by non-secretariat users """
    res = requests.get(
        f'{env.AWG_BASE_URL}{ORG_URL}',
        headers=org_admin_headers
    )
    assert res.status_code == 403
    response_contains_json(res, 'error', 'SECRETARIAT_ONLY')


#### GET /org/:identifier ####
def test_org_admin_get_mitre_org(org_admin_headers):
    """ services api rejects requests for secretariat by non-secretariat users """
    res = requests.get(
        f'{env.AWG_BASE_URL}{ORG_URL}/mitre',  # the secretariat's org
        headers=org_admin_headers
    )
    assert res.status_code == 403
    response_contains_json(res, 'error', 'NOT_SAME_ORG_OR_SECRETARIAT')


def test_org_admin_get_another_org(org_admin_headers):
    """ services api rejects requests for any org by another org user """
    different_org = str(uuid.uuid4())[:MAX_SHORTNAME_LENGTH]  # name of an org
    res = post_new_org(different_org, different_org)  # create an org
    assert res.status_code == 200
    res = requests.get(
        f'{env.AWG_BASE_URL}{ORG_URL}/{different_org}',
        headers=org_admin_headers
    )
    assert res.status_code == 403
    response_contains_json(res, 'error', 'NOT_SAME_ORG_OR_SECRETARIAT')


def test_org_admin_get_own_org(org_admin_headers):
    """ services api allows org admins to get their own org's document """
    org = org_admin_headers["CVE-API-ORG"][:MAX_SHORTNAME_LENGTH]
    res = requests.get(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}',
        headers=org_admin_headers
    )
    assert res.status_code == 200
    response_contains(res, org)


#### GET /org/:shortname/id_quota ####
def test_org_admin_get_secretariat_id_quota_info(org_admin_headers):
    """ services api rejects requests for secretariat by non-secretariat users """
    res = requests.get(
        f'{env.AWG_BASE_URL}{ORG_URL}/mitre/id_quota',  # the secretariat's org
        headers=org_admin_headers
    )
    assert res.status_code == 403
    response_contains_json(res, 'error', 'NOT_SAME_ORG_OR_SECRETARIAT')


def test_org_admin_get_another_org_id_quota_info(org_admin_headers):
    """ services api rejects requests for any org by another org user """
    different_org = str(uuid.uuid4())[:MAX_SHORTNAME_LENGTH]  # name of an org
    res = post_new_org(different_org, different_org)  # create an org
    assert res.status_code == 200
    res = requests.get(
        f'{env.AWG_BASE_URL}{ORG_URL}/{different_org}/id_quota',
        headers=org_admin_headers
    )
    assert res.status_code == 403
    response_contains_json(res, 'error', 'NOT_SAME_ORG_OR_SECRETARIAT')


def test_org_admin_get_own_id_quota_info(org_admin_headers):
    """ services api allows org admins to get info about their org's quota """
    org = org_admin_headers["CVE-API-ORG"][:MAX_SHORTNAME_LENGTH]
    res = requests.get(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/id_quota',
        headers=org_admin_headers
    )
    assert res.status_code == 200
    id_quota = json.loads(res.content.decode())['id_quota']
    assert id_quota >= 0
    assert id_quota <= 100000


#### GET /org/:shortname/user/:username ####
def test_org_admin_get_mitre_user_info(org_admin_headers):
    """ services api prevents org users from viewing secretariat user info """
    res = requests.get(
        f'{env.AWG_BASE_URL}{ORG_URL}/mitre/user/{env.AWG_USER_NAME}',
        headers=org_admin_headers
    )
    assert res.status_code == 403
    response_contains_json(res, 'error', 'NOT_SAME_ORG_OR_SECRETARIAT')


def test_org_admin_get_another_org_user_info(org_admin_headers):
    """ services api prevents org admin users from viewing another org user's info """
    org, user = create_new_user_with_new_org_by_uuid()
    res = requests.get(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}',
        headers=org_admin_headers
    )
    assert res.status_code == 403
    response_contains_json(res, 'error', 'NOT_SAME_ORG_OR_SECRETARIAT')


def test_org_admin_get_own_user_info(org_admin_headers):
    """ services api allows org admin to get its own user info """
    org = org_admin_headers["CVE-API-ORG"][:MAX_SHORTNAME_LENGTH]
    user = org_admin_headers['CVE-API-USER']
    res = requests.get(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}',
        headers=org_admin_headers
    )
    assert res.status_code == 200
    response_contains(res, user)


#### GET /org/:shortname/users ####
def test_org_admin_get_mitre_users_info(org_admin_headers):
    """ services api prevents org users from viewing secretariat users info """
    res = requests.get(
        f'{env.AWG_BASE_URL}{ORG_URL}/mitre/users',
        headers=org_admin_headers
    )
    assert res.status_code == 403
    response_contains_json(res, 'error', 'NOT_SAME_ORG_OR_SECRETARIAT')


def test_org_admin_get_another_org_users_info(org_admin_headers):
    """ services api prevents org admin users from viewing all other org's user info """
    org = str(uuid.uuid4())[:MAX_SHORTNAME_LENGTH]
    res = post_new_org(org, org)
    assert res.status_code == 200
    res = requests.get(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/users',
        headers=org_admin_headers
    )
    assert res.status_code == 403
    response_contains_json(res, 'error', 'NOT_SAME_ORG_OR_SECRETARIAT')


def test_org_admin_get_own_users_info(org_admin_headers):
    """ services api allows org admin to get its own users info """
    org = org_admin_headers["CVE-API-ORG"][:MAX_SHORTNAME_LENGTH]
    user = org_admin_headers['CVE-API-USER']
    res = requests.get(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/users',
        headers=org_admin_headers
    )
    assert res.status_code == 200
    assert len(json.loads(res.content.decode())['users']) >= 1
    response_contains(res, user)


def test_org_get_user_page(org_admin_headers):
    """ page must be a positive int """
    org = org_admin_headers["CVE-API-ORG"][:MAX_SHORTNAME_LENGTH]
    res = requests.get(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/users',
        headers=org_admin_headers,
        params={
            'page': '1',
        }
    )
    assert res.status_code == 200


def test_org_get_bad_user_page(org_admin_headers):
    """ page must be a positive int """

    # test negative
    org = org_admin_headers["CVE-API-ORG"][:MAX_SHORTNAME_LENGTH]
    res = requests.get(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/users',
        headers=org_admin_headers,
        params={
            'page': -1,
        }
    )
    assert res.status_code == 400
    response_contains_json(res, 'error', 'BAD_INPUT')
    response_contains_json(res, 'details', utils.BAD_PAGE_ERROR_DETAILS)

    # test strings
    res = requests.get(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/users',
        headers=org_admin_headers,
        params={
            'page': 'abc',
        }
    )
    assert res.status_code == 400
    response_contains_json(res, 'error', 'BAD_INPUT')
    response_contains_json(res, 'details', utils.BAD_PAGE_ERROR_DETAILS)

#### POST /org ####


def test_org_admin_cannot_create_another_org(org_admin_headers):
    """ services api does not allow org admins to create other orgs """
    res = requests.post(
        f'{env.AWG_BASE_URL}{ORG_URL}',
        headers=org_admin_headers,
        params={'short_name': str(uuid.uuid4())[:MAX_SHORTNAME_LENGTH]}
    )
    assert res.status_code == 403
    response_contains_json(res, 'error', 'SECRETARIAT_ONLY')


def test_org_admin_cannot_update_org(org_admin_headers):
    """ services api does not allow org admins to update their own orgs """
    res = requests.post(
        f'{env.AWG_BASE_URL}{ORG_URL}',
        headers=org_admin_headers,
        params={'name': str(uuid.uuid4())}
    )
    assert res.status_code == 403
    response_contains_json(res, 'error', 'SECRETARIAT_ONLY')


#### POST /org/:shortname/user ####
def test_org_admin_cannot_create_user_for_another_org(org_admin_headers):
    """ services api prevents org admins from creating a user with conflicts in the organization the user belongs to (org in path is diff from org in json body)  """
    org = str(uuid.uuid4())[:MAX_SHORTNAME_LENGTH]
    res = post_new_org(org, org)
    assert res.status_code == 200
    res = requests.post(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user',
        headers=org_admin_headers,
        json={'username': 'BLARG', 'org_UUID': 'test'}
    )
    assert res.status_code == 400
    response_contains_json(res, 'error', 'SHORTNAME_MISMATCH')


def test_org_admin_cannot_create_user_for_another_org(org_admin_headers):
    """ services api prevents org admins from creating users for other orgs """
    org = str(uuid.uuid4())[:MAX_SHORTNAME_LENGTH]
    res = post_new_org(org, org)
    assert res.status_code == 200
    res = requests.post(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user',
        headers=org_admin_headers,
        json={'username': 'BLARG'}
    )
    assert res.status_code == 403
    response_contains_json(res, 'error', 'NOT_ORG_ADMIN_OR_SECRETARIAT')


def test_org_admin_cannot_create_existen_user(org_admin_headers):
    """ services api prevents org admins from creating existing users """
    user = str(uuid.uuid4())
    org = org_admin_headers["CVE-API-ORG"][:MAX_SHORTNAME_LENGTH]
    res = post_new_org_user(org, user)
    assert res.status_code == 200
    res = requests.post(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user',
        headers=org_admin_headers,
        json={'username': user}
    )
    assert res.status_code == 400
    response_contains_json(res, 'error', 'USER_EXISTS')


#### PUT /org/:shortname/user/:username ####
def test_org_admin_cannot_update_user_org_dne(org_admin_headers):
    """ services api prevents org admins from updating a user from an org that doesn't exist """
    user = org_admin_headers['CVE-API-USER']
    org = str(uuid.uuid4())[:MAX_SHORTNAME_LENGTH]
    res = requests.put(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}',
        headers=org_admin_headers
    )
    assert res.status_code == 404
    response_contains_json(res, 'error', 'ORG_DNE_PARAM')


def test_org_admin_cannot_update_user_dne(org_admin_headers):
    """ services api prevents org admins from updating a user that doesn't exist """
    user = str(uuid.uuid4())
    org = org_admin_headers["CVE-API-ORG"][:MAX_SHORTNAME_LENGTH]
    res = requests.put(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}',
        headers=org_admin_headers
    )
    assert res.status_code == 404
    response_contains_json(res, 'error', 'USER_DNE')


def test_org_admin_cannot_update_user_for_another_org(org_admin_headers):
    """ services api prevents org admins from updating a user from a diff org """
    org, user = create_new_user_with_new_org_by_uuid()
    res = requests.put(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}',
        headers=org_admin_headers
    )
    assert res.status_code == 403
    response_contains_json(res, 'error', 'NOT_SAME_ORG_OR_SECRETARIAT')

# Admins can't change user's org
# def test_org_admin_cannot_update_user_new_shortname_dne(org_admin_headers):
#     """ services api prevents org admins from updating a user's org that doesn't exist """
#     org = org_admin_headers['CVE-API-ORG']
#     user = org_admin_headers['CVE-API-USER']
#     org_short_name = str(uuid.uuid4())
#     res = requests.put(
#         f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}?org_short_name={org_short_name}',
#         headers=org_admin_headers
#     )
#     assert res.status_code == 404
#     response_contains_json(res, 'error', 'ORG_DNE')

# Admins can't change user's org
# def test_org_admin_cannot_update_duplicate_user_with_new_shortname_and_username(org_admin_headers):
#     """ services api prevents org admins from updating a user's org and username if that user already exist """
#     org1 = org_admin_headers['CVE-API-ORG']
#     user1 = org_admin_headers['CVE-API-USER']
#     org2, user2 = create_new_user_with_new_org_by_uuid()
#     res = requests.put(
#         f'{env.AWG_BASE_URL}{ORG_URL}/{org1}/user/{user1}?org_short_name={org2}&new_username={user2}',
#         headers=org_admin_headers
#     )
#     assert res.status_code == 403
#     response_contains_json(res, 'error', 'DUPLICATE_USERNAME')


def test_org_admin_cannot_update_duplicate_user_with_new_username(org_admin_headers):
    """ services api prevents org admins from updating a user's username if that user already exist """
    org = org_admin_headers["CVE-API-ORG"][:MAX_SHORTNAME_LENGTH]
    user1 = org_admin_headers['CVE-API-USER']
    user2 = str(uuid.uuid4())
    # creating a user with same org as admin org user
    res = post_new_org_user(org, user2)
    assert res.status_code == 200
    res = requests.put(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user1}?new_username={user2}',
        headers=org_admin_headers
    )
    assert res.status_code == 403
    response_contains_json(res, 'error', 'DUPLICATE_USERNAME')

# Admin users aren't able to update a users org
# def test_org_admin_cannot_update_duplicate_user_with_new_shortname(org_admin_headers):
#     """ services api prevents org admins from updating a user's org if that user already exist """
#     user = org_admin_headers['CVE-API-USER']
#     org1 = org_admin_headers['CVE-API-ORG']
#     org2 = str(uuid.uuid4())
#     res = create_new_user_with_new_org_by_shortname(org2, user) # creating a user with same username as org admin user's username
#     res = requests.put(
#         f'{env.AWG_BASE_URL}{ORG_URL}/{org1}/user/{user}?org_short_name={org2}',
#         headers=org_admin_headers
#     )
#     assert res.status_code == 403
#     response_contains_json(res, 'error', 'NOT_ALLOWED_TO_CHANGE_ORGANIZATION')


def test_org_admin_update_same_org_user_state_sn_un(org_admin_headers):
    """  allows admin users to update a user's active state and user username """
    org = org_admin_headers["CVE-API-ORG"][:MAX_SHORTNAME_LENGTH]
    user = str(uuid.uuid4())
    # creating a user with same org as admin org user
    res = post_new_org_user(org, user)
    assert res.status_code == 200
    new_shortname = str(uuid.uuid4())[:MAX_SHORTNAME_LENGTH]   # used in query
    new_username = str(uuid.uuid4())    # used in query
    res = post_new_org(new_shortname, new_shortname)  # create new org
    assert res.status_code == 200
    res = requests.put(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}?new_username={new_username}&active=false',
        headers=org_admin_headers
    )
    assert res.status_code == 200
    assert json.loads(res.content.decode())['updated']['active'] == False
    assert json.loads(res.content.decode())[
        'updated']['username'] == new_username
    assert json.loads(res.content.decode())['updated']['username'] is not None


def test_org_admin_update_same_org_user_roles_name(org_admin_headers):
    """  allows admin users to update a user's name, add role, and remove role """
    org = org_admin_headers["CVE-API-ORG"][:MAX_SHORTNAME_LENGTH]
    user = str(uuid.uuid4())
    # creating a user with same org as admin org user
    res = post_new_org_user(org, user)
    assert res.status_code == 200
    res = requests.put(
        # adding role
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}?active_roles.add=admin',
        headers=org_admin_headers
    )
    assert res.status_code == 200
    assert json.loads(res.content.decode())[
        'updated']['authority']['active_roles'] == ["ADMIN"]
    res = requests.put(
        # removing role
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}?active_roles.remove=admin',
        headers=org_admin_headers
    )
    assert res.status_code == 200
    assert json.loads(res.content.decode())[
        'updated']['authority']['active_roles'] == []
    res = requests.put(
        # updating name
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}?name.first=t&name.last=e&name.middle=s&name.suffix=t',
        headers=org_admin_headers
    )
    assert res.status_code == 200
    assert json.loads(res.content.decode())['updated']['name']['first'] == 't'
    assert json.loads(res.content.decode())['updated']['name']['last'] == 'e'
    assert json.loads(res.content.decode())['updated']['name']['middle'] == 's'
    assert json.loads(res.content.decode())['updated']['name']['suffix'] == 't'

# Admin users can't change org?
# def test_org_admin_update_own_user_state_sn_un(org_admin_headers):
#     """  allows admin users to update its own active state, org shortname, and user username """
#     org = org_admin_headers['CVE-API-ORG']
#     user = org_admin_headers['CVE-API-USER']
#     new_shortname = str(uuid.uuid4())   # used in query
#     new_username = str(uuid.uuid4())    # used in query
#     res = post_new_org(new_shortname, new_shortname)  # create new org
#     assert res.status_code == 200
#     res = requests.put(
#         f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}?org_short_name={new_shortname}&new_username={new_username}&active=false',
#         headers=org_admin_headers
#     )
#     assert res.status_code == 200
#     assert json.loads(res.content.decode())['updated']['active'] == False
#     assert json.loads(res.content.decode())['updated']['username'] == new_username
#     assert json.loads(res.content.decode())['updated']['username'] is not None


def test_org_admin_update_own_user_roles_name(org_admin_headers):
    """  allows admin users to update its own name and remove role """
    org = org_admin_headers["CVE-API-ORG"][:MAX_SHORTNAME_LENGTH]
    user = org_admin_headers['CVE-API-USER']
    res = requests.put(
        # removing role
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}?active_roles.remove=admin',
        headers=org_admin_headers
    )
    assert res.status_code == 200
    assert json.loads(res.content.decode())[
        'updated']['authority']['active_roles'] == []
    res = requests.put(
        # adding role
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}?active_roles.add=admin',
        headers=org_admin_headers
    )
    assert res.status_code == 403
    # cannot add role because org admin doesn't have "ADMIN" role anymore
    response_contains_json(res, 'error', 'NOT_ORG_ADMIN_OR_SECRETARIAT_UPDATE')
    res = requests.put(
        # adding "ADMIN" role back to org admin user
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}?active_roles.add=admin',
        headers=utils.BASE_HEADERS
    )
    assert res.status_code == 200
    assert json.loads(res.content.decode())[
        'updated']['authority']['active_roles'] == ["ADMIN"]
    res = requests.put(
        # updating name
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}?name.first=t&name.last=e&name.middle=s&name.suffix=t',
        headers=org_admin_headers
    )
    assert res.status_code == 200
    assert json.loads(res.content.decode())['updated']['name']['first'] == 't'
    assert json.loads(res.content.decode())['updated']['name']['last'] == 'e'
    assert json.loads(res.content.decode())['updated']['name']['middle'] == 's'
    assert json.loads(res.content.decode())['updated']['name']['suffix'] == 't'


#### PUT /org/:shortname/user/:username/reset_secret ####
def test_org_admin_reset_secret_org_dne(org_admin_headers):
    org = str(uuid.uuid4())[:MAX_SHORTNAME_LENGTH]
    user = str(uuid.uuid4())
    res = requests.put(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}/reset_secret',
        headers=org_admin_headers
    )
    assert res.status_code == 404
    response_contains_json(res, 'error', 'ORG_DNE_PARAM')


def test_org_admin_reset_secret_org_dne(org_admin_headers):
    org = org_admin_headers["CVE-API-ORG"][:MAX_SHORTNAME_LENGTH]
    user = str(uuid.uuid4())
    res = requests.put(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}/reset_secret',
        headers=org_admin_headers
    )
    assert res.status_code == 404
    response_contains_json(res, 'error', 'USER_DNE')


def test_org_admin_reset_diff_org_secret(org_admin_headers):
    """ services api prevents admin users to reset the secret of users of different org"""
    org, user = create_new_user_with_new_org_by_uuid()
    res = requests.put(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}/reset_secret',
        headers=org_admin_headers
    )
    assert res.status_code == 403
    response_contains_json(res, 'error', 'NOT_SAME_ORG_OR_SECRETARIAT')


def test_org_admin_reset_same_org_secret(org_admin_headers):
    """ services api allows admin users to reset the secret of users of same org"""
    org = org_admin_headers["CVE-API-ORG"][:MAX_SHORTNAME_LENGTH]
    user = str(uuid.uuid4())
    res = post_new_org_user(org, user)
    assert res.status_code == 200
    res = requests.put(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}/reset_secret',
        headers=org_admin_headers
    )
    assert res.status_code == 200
    response_contains(res, 'API-secret')


def test_org_admin_reset_own_secret(org_admin_headers):
    """ services api allows admin users to reset their own secret """
    org = org_admin_headers["CVE-API-ORG"][:MAX_SHORTNAME_LENGTH]
    user = org_admin_headers['CVE-API-USER']
    res = requests.put(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}/reset_secret',
        headers=org_admin_headers
    )
    assert res.status_code == 200
    response_contains(res, 'API-secret')


def test_admin_role_preserved_after_resetting_own_secret(org_admin_headers):
    """ admin user's role remains after resetting own secret """
    org = org_admin_headers["CVE-API-ORG"][:MAX_SHORTNAME_LENGTH]
    user = org_admin_headers['CVE-API-USER']
    res = requests.put(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}/reset_secret',
        headers=org_admin_headers
    )
    secret = json.loads(res.content.decode())["API-secret"]
    assert res.status_code == 200

    headers2 = org_admin_headers
    headers2['CVE-API-KEY'] = secret
    response_contains(res, 'API-secret')
    res2 = requests.get(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}',
        headers=headers2
    )
    assert res2.status_code == 200
    # admin role still remains after changing secret
    assert json.loads(res2.content.decode())[
        "authority"]["active_roles"][0] == "ADMIN"
