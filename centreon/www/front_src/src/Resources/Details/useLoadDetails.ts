import { useEffect } from 'react';

import { isNil, ifElse, pathEq, always, pathOr } from 'ramda';
import { useTranslation } from 'react-i18next';
import { useAtomValue, useSetAtom, useAtom } from 'jotai';

import { useRequest, getData } from '@centreon/ui';

import {
  labelNoResourceFound,
  labelSomethingWentWrong
} from '../translatedLabels';
import useTimePeriod from '../Graph/Performance/TimePeriods/useTimePeriod';
import {
  customTimePeriodAtom,
  getNewCustomTimePeriod,
  resourceDetailsUpdatedAtom,
  selectedTimePeriodAtom
} from '../Graph/Performance/TimePeriods/timePeriodAtoms';
import { resourceDetailsDecoder } from '../decoders';

import { ResourceDetails } from './models';
import {
  clearSelectedResourceDerivedAtom,
  detailsAtom,
  selectedResourceDetailsEndpointDerivedAtom,
  selectedResourcesDetailsAtom,
  selectedResourceUuidAtom
} from './detailsAtoms';
import { ChangeCustomTimePeriodProps } from './tabs/Graph/models';

export interface DetailsState {
  changeCustomTimePeriod: (props: ChangeCustomTimePeriodProps) => void;
  loadDetails: () => void;
}

const useLoadDetails = (): DetailsState => {
  const { t } = useTranslation();

  const { sendRequest, sending } = useRequest<ResourceDetails>({
    getErrorMessage: ifElse(
      pathEq(404, ['response', 'status']),
      always(t(labelNoResourceFound)),
      pathOr(t(labelSomethingWentWrong), ['response', 'data', 'message'])
    ),
    request: getData
  });

  const [customTimePeriod, setCustomTimePeriod] = useAtom(customTimePeriodAtom);
  const selectedResource = useAtomValue(selectedResourcesDetailsAtom);
  const selectedResourceUuid = useAtomValue(selectedResourceUuidAtom);
  const selectedResourceDetailsEndpoint = useAtomValue(
    selectedResourceDetailsEndpointDerivedAtom
  );
  const setDetails = useSetAtom(detailsAtom);
  const clearSelectedResource = useSetAtom(clearSelectedResourceDerivedAtom);
  const setSelectedTimePeriod = useSetAtom(selectedTimePeriodAtom);
  const setResourceDetailsUpdated = useSetAtom(resourceDetailsUpdatedAtom);

  useTimePeriod({
    sending
  });

  const loadDetails = (): void => {
    if (isNil(selectedResource?.resourceId)) {
      return;
    }

    sendRequest({
      decoder: resourceDetailsDecoder,
      endpoint: selectedResourceDetailsEndpoint
    })
      .then((data) => {
        console.log(data);
        setDetails(data);
      })
      .catch(() => {
        clearSelectedResource();
      });
  };

  const changeCustomTimePeriod = ({ date, property }): void => {
    const newCustomTimePeriod = getNewCustomTimePeriod({
      ...customTimePeriod,
      [property]: date
    });

    setCustomTimePeriod(newCustomTimePeriod);
    setSelectedTimePeriod(null);
    setResourceDetailsUpdated(false);
  };

  useEffect(() => {
    setDetails(undefined);
    loadDetails();
  }, [
    selectedResourceUuid,
    selectedResource?.parentResourceId,
    selectedResource?.resourceId
  ]);

  return {
    changeCustomTimePeriod,
    loadDetails
  };
};

export default useLoadDetails;
