import { createStore, Provider } from 'jotai';
import { BrowserRouter } from 'react-router-dom';

import { Method, TestQueryProvider } from '@centreon/ui';
import { isOnPublicPageAtom } from '@centreon/ui-context';

import { SortOrder } from '../../../models';
import { Data, PanelOptions } from '../models';
import ResourcesTable from '../ResourcesTable';
import { resourcesEndpoint, viewByHostEndpoint } from '../api/endpoints';
import { DisplayType } from '../Listing/models';
import { getPublicWidgetEndpoint } from '../../../utils';

import {
  options as resourcesOptions,
  resources,
  columnsForViewByHost,
  columnsForViewByService,
  selectedColumnIds,
  metaServiceResources
} from './testUtils';

interface Props {
  data: Data;
  options: PanelOptions;
}

const render = ({ options, data, isPublic = false }: Props): void => {
  const store = createStore();
  store.set(isOnPublicPageAtom, isPublic);

  cy.window().then((window) => {
    cy.stub(window, 'open').as('windowOpen');
  });

  cy.viewport('macbook-11');

  cy.mount({
    Component: (
      <BrowserRouter>
        <TestQueryProvider>
          <Provider store={store}>
            <div style={{ height: '100vh', width: '100%' }}>
              <ResourcesTable
                dashboardId={1}
                globalRefreshInterval={{
                  interval: 30,
                  type: 'manual'
                }}
                id="1"
                panelData={data}
                panelOptions={options}
                playlistHash="hash"
                refreshCount={0}
              />
            </div>
          </Provider>
        </TestQueryProvider>
      </BrowserRouter>
    )
  });
};

const resourcesRequests = (): void => {
  cy.fixture('Widgets/ResourcesTable/resourcesStatus.json').then((data) => {
    cy.interceptAPIRequest({
      alias: 'getResources',
      method: Method.GET,
      path: `./api/latest${resourcesEndpoint}?page=1**`,
      response: data
    });

    cy.interceptAPIRequest({
      alias: 'getPublicWidget',
      method: Method.GET,
      path: `./api/latest${getPublicWidgetEndpoint({
        dashboardId: 1,
        playlistHash: 'hash',
        widgetId: '1'
      })}?&limit=40&page=1&sort_by=%7B%22status%22%3A%22desc%22%7D`,
      response: data
    });
  });

  cy.fixture('Widgets/ResourcesTable/resourecesStatusViewByHost.json').then(
    (data) => {
      cy.interceptAPIRequest({
        alias: 'getResourcesByHost',
        method: Method.GET,
        path: `./api/latest${viewByHostEndpoint}?page=1**`,
        response: data
      });
    }
  );

  cy.fixture('Widgets/ResourcesTable/acknowledgement.json').then((data) => {
    cy.interceptAPIRequest({
      alias: 'getAcknowledgement',
      method: Method.GET,
      path: '**acknowledgements**',
      response: data
    });
  });
  cy.fixture('Widgets/ResourcesTable/downtime.json').then((data) => {
    cy.interceptAPIRequest({
      alias: 'getDowntime',
      method: Method.GET,
      path: '**downtimes**',
      response: data
    });
  });
};

const verifyListingRows = (): void => {
  cy.contains('Centreon-Server').should('be.visible');
  cy.contains('Disk-/').should('be.visible');
  cy.contains('Load').should('be.visible');
  cy.contains('Memory').should('be.visible');
  cy.contains('Ping').should('be.visible');
};

describe('Public widget', () => {
  beforeEach(resourcesRequests);

  it('sends a request to the public API when the widget is displayed in a public page', () => {
    render({
      data: { resources },
      isPublic: true,
      options: resourcesOptions
    });

    cy.waitForRequest('@getPublicWidget');
  });
});

describe('View by all', () => {
  beforeEach(resourcesRequests);

  it('retrieves resources', () => {
    render({ data: { resources }, options: resourcesOptions });

    cy.waitForRequest('@getResources');
    verifyListingRows();

    cy.makeSnapshot();
  });

  it('executes a listing request with limit from widget properties', () => {
    render({
      data: { resources },
      options: { ...resourcesOptions, limit: 30 }
    });

    cy.waitForRequestAndVerifyQueries({
      queries: [{ key: 'limit', value: 30 }],
      requestAlias: 'getResources'
    });

    cy.contains(30).should('exist');

    cy.makeSnapshot();
  });

  it('displays listing with columns from widget selected columns properties', () => {
    render({
      data: { resources },
      options: { ...resourcesOptions, selectedColumnIds }
    });

    cy.contains('Ping').should('exist');

    cy.makeSnapshot();
  });

  it('verify that acknowledge resources row are correctly displayed with the right background color', () => {
    render({
      data: { resources },
      options: { ...resourcesOptions, states: ['acknowledged'] }
    });

    cy.contains('Load')
      .parent()
      .parent()
      .should('have.css', 'background-color', 'rgb(223, 210, 185)');

    cy.makeSnapshot();
  });

  it('verify that downtime resources row are correctly displayed with the right background color', () => {
    render({
      data: { resources },
      options: { ...resourcesOptions, states: ['in_downtime'] }
    });

    cy.contains('Disk-/')
      .parent()
      .parent()
      .should('have.css', 'background-color', 'rgb(229, 216, 243)');

    cy.makeSnapshot();
  });

  it('displays acknowledge informations when the corresponding icon is hovered', () => {
    render({
      data: { resources },
      options: { ...resourcesOptions, limit: 100, states: ['acknowledged'] }
    });

    cy.findByTestId('PersonIcon').trigger('mouseover');

    cy.contains('Author');
    cy.contains('admin');

    cy.contains('Comment');
    cy.contains('Acknowledged by admin');

    cy.makeSnapshot();
  });

  it('displays downtime informations when the corresponding icon is hovered', () => {
    render({
      data: { resources },
      options: { ...resourcesOptions, limit: 10, states: ['in_downtime'] }
    });

    cy.waitForRequest('@getResources');

    cy.get('[aria-label="Disk-/ In downtime"]').trigger('mouseover');

    cy.contains('Author');
    cy.contains('admin');

    cy.contains('Comment');
    cy.contains('Downtime set by admin');

    cy.makeSnapshot();
  });

  it('executes a listing request with sort_by param from widget properties', () => {
    render({
      data: { resources },
      options: {
        ...resourcesOptions,
        sortField: 'name',
        sortOrder: SortOrder.Desc
      }
    });

    cy.waitForRequestAndVerifyQueries({
      queries: [{ key: 'sort_by', value: '{"name":"desc"}' }],
      requestAlias: 'getResources'
    });

    cy.makeSnapshot();
  });

  it('executes a listing request with resources type filter defined in widget properties', () => {
    render({
      data: { resources },
      options: {
        ...resourcesOptions,
        limit: 30,
        sortField: 'status',
        sortOrder: SortOrder.Desc
      }
    });

    cy.waitForRequestAndVerifyQueries({
      queries: [{ key: 'types', value: '["host","service","metaservice"]' }],
      requestAlias: 'getResources'
    });

    cy.makeSnapshot();
  });

  it('executes a listing request with hostgroup_names filter defined in widget properties', () => {
    render({
      data: { resources },
      options: {
        ...resourcesOptions,
        limit: 50
      }
    });

    cy.waitForRequestAndVerifyQueries({
      queries: [{ key: 'hostgroup_names', value: '["HG1","HG2"]' }],
      requestAlias: 'getResources'
    });

    cy.makeSnapshot();
  });

  it('executes a listing request with downtime state defined in the widget properties', () => {
    render({
      data: { resources },
      options: { ...resourcesOptions, states: ['in_downtime'] }
    });

    cy.waitForRequestAndVerifyQueries({
      queries: [{ key: 'states', value: '["in_downtime"]' }],
      requestAlias: 'getResources'
    });

    cy.makeSnapshot();
  });
  it('executes a listing request with an status from widget properties', () => {
    render({
      data: { resources },
      options: { ...resourcesOptions, limit: 40 }
    });

    cy.waitForRequestAndVerifyQueries({
      queries: [
        {
          key: 'statuses',
          value: '["OK","UP","DOWN","CRITICAL","UNREACHABLE","UNKNOWN"]'
        }
      ],
      requestAlias: 'getResources'
    });

    cy.makeSnapshot();
  });

  it('redirects to the meta service panel when a meta service row is clicked', () => {
    render({
      data: { resources: metaServiceResources },
      options: {
        ...resourcesOptions,
        limit: 50
      }
    });

    cy.waitForRequestAndVerifyQueries({
      queries: [
        {
          key: 'search',
          value: '{"$and":[{"$or":[{"name":{"$rg":"^Meta service$"}}]}]}'
        }
      ],
      requestAlias: 'getResources'
    });

    cy.contains('SA_Total_FW_Connexion').click();

    cy.get('@windowOpen').should(
      'have.been.calledWith',
      '/monitoring/resources?details=%7B%22id%22%3A6%2C%22resourcesDetailsEndpoint%22%3A%22%2Fapi%2Flatest%2Fmonitoring%2Fresources%2Fmetaservices%2F6%22%2C%22selectedTimePeriodId%22%3A%22last_24_h%22%2C%22tab%22%3A%22details%22%2C%22tabParameters%22%3A%7B%7D%2C%22uuid%22%3A%22m6%22%7D&filter=%7B%22criterias%22%3A%5B%7B%22name%22%3A%22resource_types%22%2C%22value%22%3A%5B%7B%22id%22%3A%22service%22%2C%22name%22%3A%22Service%22%7D%2C%7B%22id%22%3A%22host%22%2C%22name%22%3A%22Host%22%7D%2C%7B%22id%22%3A%22metaservice%22%2C%22name%22%3A%22Meta%20service%22%7D%5D%7D%2C%7B%22name%22%3A%22statuses%22%2C%22value%22%3A%5B%7B%22id%22%3A%22OK%22%2C%22name%22%3A%22Ok%22%7D%2C%7B%22id%22%3A%22UP%22%2C%22name%22%3A%22Up%22%7D%2C%7B%22id%22%3A%22DOWN%22%2C%22name%22%3A%22Down%22%7D%2C%7B%22id%22%3A%22CRITICAL%22%2C%22name%22%3A%22Critical%22%7D%2C%7B%22id%22%3A%22UNREACHABLE%22%2C%22name%22%3A%22Unreachable%22%7D%2C%7B%22id%22%3A%22UNKNOWN%22%2C%22name%22%3A%22Unknown%22%7D%5D%7D%2C%7B%22name%22%3A%22states%22%2C%22value%22%3A%5B%5D%7D%2C%7B%22name%22%3A%22name%22%2C%22value%22%3A%5B%7B%22id%22%3A%22%5C%5CbMeta%20service%5C%5Cb%22%2C%22name%22%3A%22Meta%20service%22%7D%5D%7D%2C%7B%22name%22%3A%22search%22%2C%22value%22%3A%22%22%7D%5D%7D&fromTopCounter=true'
    );
  });
});

describe('View by service', () => {
  beforeEach(() => {
    resourcesRequests();
    render({
      data: { resources },
      options: {
        ...resourcesOptions,
        displayType: DisplayType.Service,
        limit: 20
      }
    });
  });

  it('retrieves resources', () => {
    cy.waitForRequest('@getResources');

    verifyListingRows();

    cy.makeSnapshot();
  });
  it('executes a listing request with limit from widget properties', () => {
    cy.contains(20);

    verifyListingRows();

    cy.makeSnapshot();
  });
  it('displays listing with columns from widget properties', () => {
    columnsForViewByService.forEach((element) => {
      cy.contains(element);
    });

    verifyListingRows();

    cy.makeSnapshot();
  });
});

describe('View by host', () => {
  beforeEach(() => {
    resourcesRequests();
    render({
      data: { resources },
      options: { ...resourcesOptions, displayType: DisplayType.Host, limit: 30 }
    });
  });

  it('retrieves resources', () => {
    cy.waitForRequest('@getResourcesByHost');

    cy.findByTestId('ExpandMoreIcon').click();

    verifyListingRows();
    cy.contains('Centreon-Server').should('be.visible');

    cy.makeSnapshot();
  });
  it('executes a listing request with limit from widget properties', () => {
    cy.contains('Centreon-Server').should('be.visible');

    cy.makeSnapshot();
  });

  it('displays listing with columns from widget properties', () => {
    columnsForViewByHost.forEach((element) => {
      cy.contains(element);
    });

    cy.contains('Centreon-Server').should('be.visible');

    cy.makeSnapshot();
  });
});
