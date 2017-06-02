import React from 'react';
import { Table } from 'semantic-ui-react';
import { ExperimentsTableHeader } from './components/ExperimentsTableHeader';
import { ExperimentsTableBody } from './components/ExperimentsTableBody';

export class ExperimentsTable extends React.Component {
	render() {

		const { 
			experiments, 
			filters,
			sort,
			updateQuery
		} = this.props;

		const selectedStatus = filters.status.selected;

		const selectedDataset = filters.dataset.selected;

		const selectedAlgorithm = filters.algorithm.selected;

		const currentParameters = experiments.first().get('params');

		const shouldDisplayQuality = (() => {
			return selectedStatus === 'suggested';
		})();

		const shouldDisplayAwards = (() => {
			return selectedDataset !== 'all';
		})();

		const shouldDisplayParams = (() => {
			return selectedAlgorithm !== 'all' && currentParameters.size > 0;
		})();

		const orderedParamKeys = (() => {
			return currentParameters.keySeq().sort();
		})();

		return (
			<div className="table-container">
				<Table 
					inverted
					basic
					celled
					compact
					selectable
					sortable
					structured
					unstackable
				>
					<ExperimentsTableHeader
						selectedAlgorithm={selectedAlgorithm}
						shouldDisplayQuality={shouldDisplayQuality}
						shouldDisplayParams={shouldDisplayParams}
						orderedParamKeys={orderedParamKeys}
						sort={sort}
						updateQuery={updateQuery}
					/>
					<ExperimentsTableBody
						experiments={experiments}
						shouldDisplayQuality={shouldDisplayQuality}
						shouldDisplayAwards={shouldDisplayAwards}
						shouldDisplayParams={shouldDisplayParams}
						orderedParamKeys={orderedParamKeys}
					/>
				</Table>
			</div>	
		);
	}
}