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
from src.utils import (assert_contains, ok_response_contains,
                       ok_response_contains_json, response_contains,
                       response_contains_json)

MAX_SHORTNAME_LENGTH = 32
#### PUT /org/:shortname/user/:username ####


def test_regular_user_update_name_and_username(reg_user_headers):
    """  regular users can update their name & username """
    org = reg_user_headers['CVE-API-ORG']
    user = reg_user_headers['CVE-API-USER']
    new_username = str(uuid.uuid4())  # used in query
    res = requests.put(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}?name.first=aaa&name.last=bbb&name.middle=ccc&name.suffix=ddd',
        headers=reg_user_headers
    )
    assert res.status_code == 200
    assert json.loads(res.content.decode())[
        'updated']['name']['first'] == 'aaa'
    assert json.loads(res.content.decode())['updated']['name']['last'] == 'bbb'
    assert json.loads(res.content.decode())[
        'updated']['name']['middle'] == 'ccc'
    assert json.loads(res.content.decode())[
        'updated']['name']['suffix'] == 'ddd'
    res = requests.put(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}?new_username={new_username}',
        headers=reg_user_headers
    )
    assert res.status_code == 403
    response_contains_json(res, 'error', 'NOT_ORG_ADMIN_OR_SECRETARIAT_UPDATE')


def test_regular_user_cannot_update_for_another_user(reg_user_headers):
    """ regular users cannot update information of another user of the same organization """
    org = reg_user_headers['CVE-API-ORG']
    user = reg_user_headers['CVE-API-USER']
    user2 = str(uuid.uuid4())
    # creating a user with same org as regular user
    res = post_new_org_user(org, user2)
    assert res.status_code == 200
    user_name = str(uuid.uuid4())  # create a new name to give to second user
    res = requests.put(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user2}?new_username={user_name}',
        headers=reg_user_headers
    )
    assert res.status_code == 403
    response_contains_json(res, 'error', 'NOT_SAME_USER_OR_SECRETARIAT')


def test_regular_user_cannot_update_duplicate_user_with_new_username(reg_user_headers):
    """ regular users cannot update a user's username if that user already exist """
    org = reg_user_headers['CVE-API-ORG']
    user1 = reg_user_headers['CVE-API-USER']
    user2 = str(uuid.uuid4())
    # creating a user with same org as regular user
    res = post_new_org_user(org, user2)
    assert res.status_code == 200
    res = requests.put(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user1}?new_username={user2}',
        headers=reg_user_headers
    )
    assert res.status_code == 403
    response_contains_json(res, 'error', 'NOT_ORG_ADMIN_OR_SECRETARIAT_UPDATE')


def test_regular_user_cannot_update_organization_with_new_shortname(reg_user_headers):
    """ regular users cannot update organization """
    user = reg_user_headers['CVE-API-USER']
    org1 = reg_user_headers['CVE-API-ORG']
    org2 = str(uuid.uuid4())[:MAX_SHORTNAME_LENGTH]
    res = requests.put(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org1}/user/{user}?org_short_name={org2}',
        headers=reg_user_headers
    )
    assert res.status_code == 403
    response_contains_json(res, 'error', 'NOT_ALLOWED_TO_CHANGE_ORGANIZATION')


def test_regular_user_cannot_update_active_state(reg_user_headers):
    """ regular user cannot change its own active state """
    org = reg_user_headers['CVE-API-ORG']
    user = reg_user_headers['CVE-API-USER']
    res = requests.put(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}?active=false',
        headers=reg_user_headers
    )
    assert res.status_code == 403
    response_contains_json(res, 'error', 'NOT_ORG_ADMIN_OR_SECRETARIAT_UPDATE')


def test_regular_user_cannot_add_role(reg_user_headers):
    """  regular users cannot add role """
    org = reg_user_headers['CVE-API-ORG']
    user = reg_user_headers['CVE-API-USER']
    res = requests.put(
        # adding role
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}?active_roles.add=admin',
        headers=reg_user_headers
    )
    assert res.status_code == 403
    response_contains_json(res, 'error', 'NOT_ORG_ADMIN_OR_SECRETARIAT_UPDATE')


def test_regular_user_cannot_remove_role(reg_user_headers):
    """  regular users cannot remove role """
    org = reg_user_headers['CVE-API-ORG']
    user = reg_user_headers['CVE-API-USER']
    res = requests.put(
        # removing role
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}?active_roles.remove=admin',
        headers=reg_user_headers
    )
    assert res.status_code == 403
    response_contains_json(res, 'error', 'NOT_ORG_ADMIN_OR_SECRETARIAT_UPDATE')


def test_regular_user_cannot_update_user_org_dne(reg_user_headers):
    """ regular user cannot update a user from an org that doesn't exist """
    org = str(uuid.uuid4())[:MAX_SHORTNAME_LENGTH]
    user = reg_user_headers['CVE-API-USER']
    res = requests.put(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}',
        headers=reg_user_headers
    )
    assert res.status_code == 404
    response_contains_json(res, 'error', 'ORG_DNE_PARAM')


def test_reg_user_cannot_update_user_dne(reg_user_headers):
    """ regular user cannot update a user that doesn't exist """
    org = reg_user_headers['CVE-API-ORG']
    user = str(uuid.uuid4())
    res = requests.put(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}',
        headers=reg_user_headers
    )
    assert res.status_code == 404
    response_contains_json(res, 'error', 'USER_DNE')


#### POST /org/:shortname/user ###
def test_reg_user_cannot_create_user(reg_user_headers):
    """ regular user cannot create another user """
    org = reg_user_headers['CVE-API-ORG']
    user_name = str(uuid.uuid4())
    res = requests.post(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user',
        headers=reg_user_headers,
        json={'username': user_name}
    )
    assert res.status_code == 403
    response_contains_json(res, 'error', 'NOT_ORG_ADMIN_OR_SECRETARIAT')


#### PUT /org/:shortname ####
def test_reg_user_cannot_update_org(reg_user_headers):
    """ regular user cannot update an organization """
    org = str(uuid.uuid4())[:MAX_SHORTNAME_LENGTH]
    res = requests.put(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}',
        headers=reg_user_headers
    )
    assert res.status_code == 403
    response_contains_json(res, 'error', 'SECRETARIAT_ONLY')


#### GET /org/:identifier ####
def test_reg_user_can_view_same_org(reg_user_headers):
    """ regular users can view the organization they belong to """
    org = reg_user_headers['CVE-API-ORG']
    res = requests.get(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}',
        headers=reg_user_headers
    )
    ok_response_contains_json(res, 'short_name', org)


def test_reg_user_cannot_view_another_org(reg_user_headers):
    """ regular users cannot view an organization they don't belong to """
    org = str(uuid.uuid4())[:MAX_SHORTNAME_LENGTH]
    res = requests.get(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}',
        headers=reg_user_headers
    )
    assert res.status_code == 403
    response_contains_json(res, 'error', 'NOT_SAME_ORG_OR_SECRETARIAT')


#### GET /org ####
def test_reg_user_cannot_view_orgs(reg_user_headers):
    """ regular users cannot view all organizations """
    res = requests.get(
        f'{env.AWG_BASE_URL}{ORG_URL}',
        headers=reg_user_headers
    )
    assert res.status_code == 403
    response_contains_json(res, 'error', 'SECRETARIAT_ONLY')


#### GET /org/:shortname/users ####
def test_reg_user_can_view_users_same_org(reg_user_headers):
    """ regular users can view users of the same organization """
    org = reg_user_headers['CVE-API-ORG']
    res = requests.get(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/users',
        headers=reg_user_headers
    )
    assert res.status_code == 200
    assert len(json.loads(res.content.decode())['users']) > 0


def test_reg_user_cannot_view_users_org_dne(reg_user_headers):
    """ regular users cannot view users of an organization that doesn't exist """
    org = str(uuid.uuid4())[:MAX_SHORTNAME_LENGTH]
    res = requests.get(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/users',
        headers=reg_user_headers
    )
    assert res.status_code == 404
    response_contains_json(res, 'error', 'ORG_DNE_PARAM')


def test_reg_user_cannot_view_users_another_org(reg_user_headers):
    """ regular users cannot view users of another organization """
    org = str(uuid.uuid4())[:MAX_SHORTNAME_LENGTH]
    res = post_new_org(org, org)
    assert res.status_code == 200
    res = requests.get(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/users',
        headers=reg_user_headers
    )
    assert res.status_code == 403
    response_contains_json(res, 'error', 'NOT_SAME_ORG_OR_SECRETARIAT')


#### GET /org/:shortname/user/:username ####
def test_reg_user_can_view_users_same_org(reg_user_headers):
    """ regular users can view users of the same organization """
    org = reg_user_headers['CVE-API-ORG']
    user = str(uuid.uuid4())
    res = post_new_org_user(org, user)
    assert res.status_code == 200
    res = requests.get(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}',
        headers=reg_user_headers
    )
    ok_response_contains_json(res, 'username', user)


def test_reg_user_cannot_view_user_from_another_org(reg_user_headers):
    """ regular users cannot view users from another organization """
    org, user = create_new_user_with_new_org_by_uuid()
    res = requests.get(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}',
        headers=reg_user_headers
    )
    assert res.status_code == 403
    response_contains_json(res, 'error', 'NOT_SAME_ORG_OR_SECRETARIAT')


def test_reg_user_cannot_view_user_dne(reg_user_headers):
    """ regular user cannot view user that doesn't exist """
    org = reg_user_headers['CVE-API-ORG']
    user = str(uuid.uuid4())
    res = requests.get(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}',
        headers=reg_user_headers
    )
    assert res.status_code == 404
    response_contains_json(res, 'error', 'USER_DNE')


#### GET /org/:shortname/id_quota ####
def test_reg_user_can_get_org_id_quota(reg_user_headers):
    """ regular users can see their organization's cve id quota """
    org = reg_user_headers['CVE-API-ORG']
    res = requests.get(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/id_quota',
        headers=reg_user_headers
    )
    ok_response_contains(res, 'id_quota')
    ok_response_contains(res, 'total_reserved')
    ok_response_contains(res, 'available')


def test_reg_user_cannot_get_another_org_id_quota(reg_user_headers):
    """ regular users cannot see an organization's cve id quota they don't belong to """
    org = str(uuid.uuid4())[:MAX_SHORTNAME_LENGTH]
    user = str(uuid.uuid4())
    create_new_user_with_new_org_by_shortname(org, user)
    res = requests.get(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/id_quota',
        headers=reg_user_headers
    )
    assert res.status_code == 403
    response_contains_json(res, 'error', 'NOT_SAME_ORG_OR_SECRETARIAT')


#### PUT /org/:shortname/user/:username/reset_secret ####
def test_regular_user_reset_secret(reg_user_headers):
    """ regular users can update their secret """
    org = reg_user_headers['CVE-API-ORG']
    user = reg_user_headers['CVE-API-USER']
    res = requests.put(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}/reset_secret',
        headers=reg_user_headers
    )
    ok_response_contains(res, 'API-secret')


def test_regular_user_cannot_reset_secret_of_another_user(reg_user_headers):
    """ regular user cannot update the secret of another user """
    org = reg_user_headers['CVE-API-ORG']
    user = str(uuid.uuid4())
    res = post_new_org_user(org, user)  # creating a user
    assert res.status_code == 200
    res = requests.put(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}/reset_secret',
        headers=reg_user_headers
    )
    assert res.status_code == 403
    response_contains_json(res, 'error', 'NOT_SAME_USER_OR_SECRETARIAT')


def test_regular_user_cannot_reset_secret_user_org_dne(reg_user_headers):
    """ regular user cannot reset the secret of a user from an org that doesn't exist """
    org = str(uuid.uuid4())[:MAX_SHORTNAME_LENGTH]
    user = reg_user_headers['CVE-API-USER']
    res = requests.put(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}/reset_secret',
        headers=reg_user_headers
    )
    assert res.status_code == 404
    response_contains_json(res, 'error', 'ORG_DNE_PARAM')


def test_regular_user_cannot_reset_secret_user_dne(reg_user_headers):
    """ regular user cannot reset the secret of a user that doesn't exist """
    org = reg_user_headers['CVE-API-ORG']
    user = str(uuid.uuid4())
    res = requests.put(
        f'{env.AWG_BASE_URL}{ORG_URL}/{org}/user/{user}/reset_secret',
        headers=reg_user_headers
    )
    assert res.status_code == 404
    response_contains_json(res, 'error', 'USER_DNE')


def test_regular_user_cannot_reset_admin_user_secret(reg_user_headers, org_admin_headers):
    """ regular user tries resetting admin user's secret, fails and admin user's role remains preserved """
    reg_org = reg_user_headers['CVE-API-ORG']
    user = org_admin_headers['CVE-API-USER']
    res = post_new_org_user(reg_org, user)  # creating the user
    assert res.status_code == 200
    res = requests.put(
        f'{env.AWG_BASE_URL}{ORG_URL}/{reg_org}/user/{user}/reset_secret',
        headers=reg_user_headers
    )
    assert res.status_code == 403
    response_contains_json(res, 'error', 'NOT_SAME_USER_OR_SECRETARIAT')
    # Check that user's admin role is preserved
    admin_org = org_admin_headers['CVE-API-ORG']
    res2 = requests.get(
        f'{env.AWG_BASE_URL}{ORG_URL}/{admin_org}/user/{user}',
        headers=org_admin_headers
    )
    assert res2.status_code == 200
    # admin role still remains after attempting to change secret
    assert json.loads(res2.content.decode())[
        "authority"]["active_roles"][0] == "ADMIN"


#### POST /org ####
def test_reg_user_cannot_post_new_org(reg_user_headers):
    """ regular users cannot create new org """
    res = requests.post(
        f'{env.AWG_BASE_URL}{ORG_URL}',
        headers=reg_user_headers
    )
    assert res.status_code == 403
    response_contains_json(res, 'error', 'SECRETARIAT_ONLY')
