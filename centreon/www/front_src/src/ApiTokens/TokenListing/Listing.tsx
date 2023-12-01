import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';

import Divider from '@mui/material/Divider';

import { MemoizedListing as TokenListing } from '@centreon/ui';

import TokenCreationButton from '../TokenCreation';
import CreateTokenDialog from '../TokenCreation/CreateTokenDialog';
import { isCreateTokenAtom } from '../TokenCreation/atoms';
import { labelApiToken } from '../translatedLabels';

import Actions from './Actions';
import Refresh from './Actions/Refresh';
import { useColumns } from './ComponentsColumn/useColumns';
import Title from './Title';
import { useStyles } from './tokenListing.styles';
import { useTokenListing } from './useTokenListing';

const Listing = (): JSX.Element | null => {
  const { classes } = useStyles();
  const { t } = useTranslation();
  const isCreateToken = useAtomValue(isCreateTokenAtom);

  const {
    dataListing,
    changePage,
    changeLimit,
    onSort,
    sortedField,
    sortOrder,
    refetch
  } = useTokenListing();

  const { columns, selectedColumnIds, onSelectColumns, onResetColumns } =
    useColumns();

  return (
    <div className={classes.container}>
      <Title msg={t(labelApiToken)} />
      <Divider className={classes.divider} />
      <TokenListing
        innerScrollDisabled
        actions={
          <Actions
            buttonCreateToken={<TokenCreationButton />}
            refresh={
              <Refresh isLoading={dataListing?.isLoading} onRefresh={refetch} />
            }
          />
        }
        actionsBarMemoProps={[dataListing?.isLoading]}
        columnConfiguration={{ selectedColumnIds, sortable: true }}
        columns={columns}
        currentPage={(dataListing?.page || 1) - 1}
        getId={({ name }) => name}
        limit={dataListing?.limit}
        loading={dataListing?.isLoading}
        rows={dataListing?.rows}
        sortField={sortedField}
        sortOrder={sortOrder}
        totalRows={dataListing?.total}
        onLimitChange={changeLimit}
        onPaginate={changePage}
        onResetColumns={onResetColumns}
        onSelectColumns={onSelectColumns}
        onSort={onSort}
      />
      {isCreateToken && <CreateTokenDialog />}
    </div>
  );
};
export default Listing;
