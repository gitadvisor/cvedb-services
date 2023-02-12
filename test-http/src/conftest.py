import json
import pytest
import requests
import uuid
import random
import string
from src import env, utils

MAX_SHORTNAME_LENGTH = 32


@pytest.fixture
def org_admin_headers():
    """ create an org and an admin user for that org, return user's headers """
    letters = string.ascii_lowercase
    org = ''.join(random.choice(letters)
                  for i in range(10))  # generate random org name
    org_res = requests.post(
        f'{env.AWG_BASE_URL}/api/org',  # secretariat creates an org
        headers=utils.BASE_HEADERS,
        json={'name': org, 'short_name': org}
    )
    user = str(uuid.uuid4())  # dummy user name
    user_res = requests.post(
        # secretariat creates a user that belongs to the new org
        f'{env.AWG_BASE_URL}/api/org/{org}/user',
        headers=utils.BASE_HEADERS,
        json={'username': user}
    )
    secret = json.loads(user_res.content.decode())[
        'created']['secret']  # dummy user API key
    admin_res = requests.put(
        f'{env.AWG_BASE_URL}/api/org/{org}/user/{user}',
        headers=utils.BASE_HEADERS,
        # secretariat adds the ADMIN role to the new user
        params={'active_roles.add': 'ADMIN'}
    )
    return {
        'CVE-API-KEY': secret,
        'CVE-API-ORG': org,
        'CVE-API-USER': user
    }

@pytest.fixture
def bulk_download_user_headers():
    """ create an org and user for BULK_DOWNLOAD testing, return user's headers """
    letters = string.ascii_lowercase
    org = ''.join(random.choice(letters)
                  for i in range(10))  # generate random org name
    org_res = requests.post(
        f'{env.AWG_BASE_URL}/api/org',  # secretariat creates an org
        headers=utils.BASE_HEADERS,
        json={'name': org, 'short_name': org, 'authority': {'active_roles': ['BULK_DOWNLOAD']}, \
        'policies': {'id_quota': 0}}
    )
    user = str(uuid.uuid4())  # dummy user name
    user_res = requests.post(
        # secretariat creates a user that belongs to the new org
        f'{env.AWG_BASE_URL}/api/org/{org}/user',
        headers=utils.BASE_HEADERS,
        json={'username': user}
    )

    secret = json.loads(user_res.content.decode())[
        'created']['secret']  # dummy user API key
    return {
        'CVE-API-KEY': secret,
        'CVE-API-ORG': org,
        'CVE-API-USER': user
    }    

@pytest.fixture
def reg_user_headers():
    """ create an org and an regular user for that org, return user's headers """
    letters = string.ascii_lowercase
    org = ''.join(random.choice(letters)
                  for i in range(10))  # generate random org name
    org_res = requests.post(
        f'{env.AWG_BASE_URL}/api/org',  # secretariat creates an org
        headers=utils.BASE_HEADERS,
        json={'name': org, 'short_name': org}
    )
    user = str(uuid.uuid4())  # dummy user name
    user_res = requests.post(
        # secretariat creates a user that belongs to the new org
        f'{env.AWG_BASE_URL}/api/org/{org}/user',
        headers=utils.BASE_HEADERS,
        json={'username': user}
    )

    secret = json.loads(user_res.content.decode())[
        'created']['secret']  # dummy user API key
    return {
        'CVE-API-KEY': secret,
        'CVE-API-ORG': org,
        'CVE-API-USER': user
    }


# TEST RE-ORDERING
# ==============================================================================
# Tests are re-ordered, and since the default `config/.bashrc` test aliases use
# Pytest's `-x` fail-fast flag, the tests that are run build in complexity and
# earlier failures likely indicate problems that could cause many tests to fail
# (while later failures likely indicate isolated problems).

# The following ordering is currently used:
# 1. `demon` tests which test the test infrastructure and app health checks
# 2. `elements` tests which check the nature of elements on each page; these
# serve as canaries for when a page may have diverged from its corresponding
# tests
# 3. `page_url`, `header`, `cancel` tests are consistent across pages and may
# indicate a broader app change, for instance a new navigation bar; these tests
# also exercise the (above) page fixtures with generic functionality
# 4. `mitre` tests help to ensure, for instance, that the CPS under test has
# a MITRE CNA and its ID quota is >99,998
# 5. all other "systems" tests
# 6. all "interfaces" tests


def pytest_collection_modifyitems(items):
    # arranges tests with these priority elements first
    prioritize = ['demon', 'elements', 'page_url', 'header', 'cancel', 'mitre']
    arranged = 0
    for tag in prioritize:
        for i in range(arranged, len(items)):
            if tag in items[i].name:
                items[arranged], items[i] = items[i], items[arranged]
                arranged += 1

    # move the `interface` tests to the end
    items = list(reversed(items))
    deprioritize = ['interface']
    deranged = 0
    for tag in deprioritize:
        for i in range(deranged, len(items)):
            if tag in items[i].name:
                items[deranged], items[i] = items[i], items[deranged]
                deranged += 1
    items = list(reversed(items))


# PYTEST REPEAT FLAG
# =============================================================================
# give users the option to run any collected tests a flag-set number of times,
# which can help check for non-deterministic failures


def pytest_addoption(parser):
    parser.addoption(
        '--repeat', action='store',
        help='Set the number of times to repeat each test.')


def pytest_generate_tests(metafunc):
    repeat_arg = metafunc.config.option.repeat
    if repeat_arg is not None:
        repeat_fixture = 'repeat_tests'
        n_repeat = int(repeat_arg)
        assert n_repeat > 0

        # test repetition is achieved by adding a fixture to each test, and by
        # using the `pytest.mark.parameterize` pattern to parameterize on the
        # following `repeat_tests` fixture; without changing its value the test
        # just runs `n_repeat` times
        metafunc.fixturenames.append(repeat_fixture)
        metafunc.parametrize(repeat_fixture, range(n_repeat))
