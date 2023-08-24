import { createStore } from 'jotai';
import dayjs from 'dayjs';

import { Method } from '@centreon/ui';

import { Data, FormThreshold, FormTimePeriod } from './models';
import { labelNoDataFound } from './translatedLabels';
import { graphEndpoint } from './api/endpoints';

import Widget from '.';

const serviceMetrics: Data = {
  metrics: [
    {
      id: 2,
      metrics: [
        {
          id: 2,
          name: 'cpu',
          unit: '%'
        },
        {
          id: 3,
          name: 'cpu AVG',
          unit: '%'
        }
      ],
      name: 'Cpu'
    }
  ]
};

const emptyServiceMetrics: Data = {
  metrics: []
};

const disabledThreshold: FormThreshold = {
  criticalType: 'default',
  customCritical: 0,
  customWarning: 0,
  enabled: false,
  warningType: 'default'
};

const defaultThreshold: FormThreshold = {
  criticalType: 'default',
  customCritical: 0,
  customWarning: 0,
  enabled: true,
  warningType: 'default'
};

const criticalThreshold: FormThreshold = {
  criticalType: 'custom',
  customCritical: 20,
  customWarning: 10,
  enabled: true,
  warningType: 'custom'
};

const warningThreshold: FormThreshold = {
  criticalType: 'default',
  customCritical: 0,
  customWarning: 20,
  enabled: true,
  warningType: 'custom'
};

const defaultTimePeriod: FormTimePeriod = {
  timePeriodType: 1
};

const last7DaysTimePeriod: FormTimePeriod = {
  timePeriodType: 7 * 24
};

const customTimePeriod: FormTimePeriod = {
  end: '2021-09-02T00:00:00.000Z',
  start: '2021-09-01T00:00:00.000Z',
  timePeriodType: -1
};

interface InitializeComponentProps {
  data?: Data;
  threshold?: FormThreshold;
  timePeriod?: FormTimePeriod;
}

const initializeComponent = ({
  data = serviceMetrics,
  threshold = defaultThreshold,
  timePeriod = defaultTimePeriod
}: InitializeComponentProps): void => {
  const store = createStore();

  cy.viewport('macbook-13');

  cy.fixture('Widgets/Graph/lineChart.json').then((lineChart) => {
    cy.interceptAPIRequest({
      alias: 'getLineChart',
      method: Method.GET,
      path: `${graphEndpoint}**`,
      response: lineChart
    });
  });

  cy.mount({
    Component: (
      <div style={{ height: '400px', width: '100%' }}>
        <Widget
          panelData={data}
          panelOptions={{
            globalRefreshInterval: 30,
            refreshInterval: 'manual',
            threshold,
            timeperiod: timePeriod
          }}
          store={store}
        />
      </div>
    )
  });
};

describe('Graph Widget', () => {
  it('displays a message when the widget has no metric', () => {
    initializeComponent({ data: emptyServiceMetrics });
    cy.contains(labelNoDataFound).should('be.visible');

    cy.matchImageSnapshot();
  });

  it('displays the line chart when the widget has metrics', () => {
    initializeComponent({});

    cy.waitForRequest('@getLineChart').then(({ request }) => {
      expect(request.url.search).to.include('metricIds=[2,3]');

      const start = dayjs(request.url.searchParams.get('start'));
      const end = dayjs(request.url.searchParams.get('end'));
      expect(end.diff(start, 'hour')).to.equal(1);
    });

    cy.contains('cpu (%)').should('be.visible');
    cy.contains('cpu AVG (%)').should('be.visible');
    cy.findByTestId('threshold-55.201388888888886').should('be.visible');
    cy.findByTestId('threshold-0').should('be.visible');

    cy.findByTestId('threshold-55.201388888888886-tooltip').trigger(
      'mouseover'
    );
    cy.contains('Warning threshold: 70 %. Value defined by metric cpu');

    cy.findByTestId('threshold-0-tooltip').trigger('mouseover');
    cy.contains('Critical threshold: 90 %. Value defined by metric cpu');

    cy.matchImageSnapshot();
  });

  it('displays the line chart without thresholds when thresholds are disabled', () => {
    initializeComponent({ threshold: disabledThreshold });

    cy.findByTestId('threshold-55.201388888888886').should('not.exist');
    cy.findByTestId('threshold-0').should('not.exist');

    cy.matchImageSnapshot();
  });

  it('displays the line chart with customized warning threshold', () => {
    initializeComponent({ threshold: warningThreshold });

    cy.findByTestId('threshold-193.20486111111111').should('be.visible');
    cy.findByTestId('threshold-0').should('be.visible');

    cy.findByTestId('threshold-193.20486111111111-tooltip').trigger(
      'mouseover'
    );
    cy.contains('Warning threshold: 20 %. Value customized');

    cy.matchImageSnapshot();
  });

  it('displays the line chart with customized critical threshold', () => {
    initializeComponent({ threshold: criticalThreshold });

    cy.findByTestId('threshold-186.3046875').should('be.visible');
    cy.findByTestId('threshold-124.203125').should('be.visible');

    cy.findByTestId('threshold-124.203125-tooltip').trigger('mouseover');
    cy.contains('Critical threshold: 20 %. Value customized');

    cy.matchImageSnapshot();
  });

  it('displays the line chart with a custom time period', () => {
    initializeComponent({ timePeriod: customTimePeriod });

    cy.waitForRequest('@getLineChart').then(({ request }) => {
      expect(request.url.search).to.include('start=2021-09-01T00:00:00.000Z');
      expect(request.url.search).to.include('end=2021-09-02T00:00:00.000Z');
    });
  });

  it('displays the line chart with a last 7 days time period', () => {
    initializeComponent({ timePeriod: last7DaysTimePeriod });

    cy.waitForRequest('@getLineChart').then(({ request }) => {
      const start = dayjs(request.url.searchParams.get('start'));
      const end = dayjs(request.url.searchParams.get('end'));
      expect(end.diff(start, 'hour')).to.equal(7 * 24);
    });
  });
});
