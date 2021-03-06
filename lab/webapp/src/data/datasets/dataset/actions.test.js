/* ~This file is part of the PennAI library~

Copyright (C) 2017 Epistasis Lab, University of Pennsylvania

PennAI is maintained by:
    - Heather Williams (hwilli@upenn.edu)
    - Weixuan Fu (weixuanf@upenn.edu)
    - William La Cava (lacava@upenn.edu)
    - Michael Stauffer (stauffer@upenn.edu)
    - and many other generous open source contributors

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.

(Autogenerated header, do not modify)

*/
import * as actionStuff from './actions';

// redux actions for toggling AI and updating datasets - these actions take new
// input and emit corresponding redux actions
describe('testing how some UI action affects redux action stuff', () => {
  it('updateAI', () => {
    // mock input
    const testDatasetID = '1234321';
    const testState = {
      nextAIState: 'toggled'
    };
    // expected result
    const expectedAction = {
      type: actionStuff.AI_UPDATE,
      id: testDatasetID,
      nextAIState: testState
    };
    expect(actionStuff.updateAI(testDatasetID, testState))
      .toEqual(expectedAction);
  })

  it('updateDataset', () => {
    const testDataset = {
      id: 'da_data',
      info: {
        experiment: 'pass',
        result: [3,4,5]
      }
    };
    const expectedAction = {
      type: actionStuff.DATASET_UPDATE,
      dataset: testDataset
    };
    expect(actionStuff.updateDataset(testDataset))
      .toEqual(expectedAction);
  })
})

import * as apiTestHelper from './__mocks__/api';
//jest.mock('./api');
describe('testing mock api calls in redux action reducer', () => {

  it('toggleAI, expect success', () => {
    const testDatasetID = 12345;
    const nextAIState = {};

    expect.assertions(1);
    // let test = actionStuff.uploadDataset(testDatasetID);
    // expect(test).toEqual('d');

    return apiTestHelper.toggleAI(testDatasetID, nextAIState)
      .then(fakeData => expect(fakeData).toEqual({uploadedID: testDatasetID}));
  })

  it('toggleAI, expect failure', () => {
    const testDatasetID = 123345;
    const nextAIState = {};

    expect.assertions(1);

    return apiTestHelper.toggleAI(testDatasetID, nextAIState)
      .catch(e => expect(e).toEqual({error: 'wrong id ' + testDatasetID + ' ,expected 12345'}));
  })

  it('uploadDataset, expect success', () => {
    const testDatasetID = 9876;
    const nextAIState = {};

    expect.assertions(1);

    return apiTestHelper.uploadDataset(testDatasetID, nextAIState)
      .then(fakeData => expect(fakeData).toEqual({uploadedID: testDatasetID}));
  })

  it('uploadDataset, expect failure', () => {
    const testDatasetID = 123345;
    const nextAIState = {};

    expect.assertions(1);

    return apiTestHelper.uploadDataset(testDatasetID, nextAIState)
      .catch(e => expect(e).toEqual({error: 'wrong id ' + testDatasetID + ' ,expected 09876'}));
  })
})
