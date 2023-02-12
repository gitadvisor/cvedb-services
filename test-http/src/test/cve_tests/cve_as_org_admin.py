import json
import requests
from src import env
from src.utils import response_contains_json

CVE_URL = '/api/cve'
cve_id = 'CVE-1999-0001'
update_cve_id = create_cve_id = 'CVE-2000-0008'

#Also need to update with new permissions

# #### GET /cve ####
# def test_get_all_cves(org_admin_headers):
#     """ services api rejects requests for admin orgs """
#     res = requests.get(
#         f'{env.AWG_BASE_URL}{CVE_URL}/',
#         headers=org_admin_headers
#     )
#     assert res.status_code == 403
#     response_contains_json(res, 'error', 'SECRETARIAT_ONLY')


# #### GET /cve/:id ####
# def test_get_cve(org_admin_headers):
#     """ services api rejects requests for admin orgs """
#     res = requests.get(
#         f'{env.AWG_BASE_URL}{CVE_URL}/{cve_id}',
#         headers=org_admin_headers
#     )
#     assert res.status_code == 403
#     response_contains_json(res, 'error', 'SECRETARIAT_ONLY')


# #### POST /cve/:id ####
# def test_create_cve(org_admin_headers):
#     """ services api rejects requests for admin orgs """
#     with open('./src/test/cve_tests/cve_record_fixtures/CVE-2000-0008_published.json') as json_file:
#         data = json.load(json_file)
#         res = requests.post(
#             f'{env.AWG_BASE_URL}{CVE_URL}/{create_cve_id}',
#             headers=org_admin_headers,
#             json=data
#         )
#         assert res.status_code == 403
#         response_contains_json(res, 'error', 'SECRETARIAT_ONLY')


# #### PUT /cve/:id ####
# def test_update_cve_record(org_admin_headers):
#     """ services api rejects requests for admin orgs """
#     with open('./src/test/cve_tests/cve_record_fixtures/CVE-2000-0008_published.json') as json_file:
#         data = json.load(json_file)
#         res = requests.put(
#             f'{env.AWG_BASE_URL}{CVE_URL}/{update_cve_id}',
#             headers=org_admin_headers,
#             json=data
#         )
#         assert res.status_code == 403
#         response_contains_json(res, 'error', 'SECRETARIAT_ONLY')
