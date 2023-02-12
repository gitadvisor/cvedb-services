import pytest
import requests
from src import env, utils
from src.utils import response_contains, response_contains_json

CVE_ID_RANGE_URL = '/api/cve-id-range'


#### POST /cve-id-range/:year ####
@pytest.mark.parametrize(
    "choose_year",
    [str(x) for x in range(1999, utils.CURRENT_YEAR + 1)])
def test_post_cve_id_range_already_exists(choose_year):
    """ ranges for 1999 to the current year must exist """
    res = requests.post(
        f'{env.AWG_BASE_URL}{CVE_ID_RANGE_URL}/{choose_year}',
        headers=utils.BASE_HEADERS
    )
    assert res.status_code == 400
    response_contains(
        res,
        (f'document for year {choose_year} was not created '
         'because it already exists.'))
    response_contains_json(res, 'error', 'YEAR_RANGE_EXISTS')
