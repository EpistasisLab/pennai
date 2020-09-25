/* ~This file is part of the PennAI library~

Copyright (C) 2017 Epistasis Lab, University of Pennsylvania

PennAI is maintained by:
    - Heather Williams (hwilli@upenn.edu)
    - Weixuan Fu (weixuanf@pennmedicine.upenn.edu)
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
import { combineReducers } from 'redux';
import {
  SUBMIT_EXPERIMENT_REQUEST,
  SUBMIT_EXPERIMENT_SUCCESS,
  SUBMIT_EXPERIMENT_FAILURE,
  SET_CURRENT_ALGORITHM,
  SET_PARAM_VALUE,
  CLEAR_ERROR
} from './actions';

const currentAlgorithm = (state = {}, action) => {
  switch(action.type) {
    case SET_CURRENT_ALGORITHM:
      return action.payload.algorithm;
    default:
      return state;
  }
};

const currentParams = (state = {}, action) => {
  switch(action.type) {
    case SET_PARAM_VALUE:
      const { param, value } = action.payload;
      return Object.assign({}, state, {
        [param]: value
      });
    case SET_CURRENT_ALGORITHM:
      const { algorithm } = action.payload;
      return Object.entries(algorithm.schema).reduce((map, [key, value]) => {
        map[key] = value.default;
        return map;
      }, {});
    default:
      return state;
  }
};

const isSubmitting = (state = false, action) => {
  switch(action.type) {
    case SUBMIT_EXPERIMENT_REQUEST:
      return true;
    case SUBMIT_EXPERIMENT_SUCCESS:
    case SUBMIT_EXPERIMENT_FAILURE:
      return false; 
    default:
      return state;
  }
};

const error = (state = null, action) => {
  switch(action.type) {
    case SUBMIT_EXPERIMENT_FAILURE:
      return action.payload;
    case SUBMIT_EXPERIMENT_REQUEST:
    case SUBMIT_EXPERIMENT_SUCCESS:
    case CLEAR_ERROR:
      return null;
    default:
      return state;  
  }
};

const builder = combineReducers({
  currentAlgorithm,
  currentParams,
  isSubmitting,
  error
});

export default builder;