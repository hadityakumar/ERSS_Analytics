import { combineReducers } from 'redux';
import { keplerGlReducer } from '@kepler.gl/reducers';

const customKeplerGlReducer = keplerGlReducer.initialState({
  mapStyle: {
    // mapStyles: {},
    styleType: 'customStyle'
  }
});

// Use the custom reducer
const reducers = combineReducers({
  keplerGl: customKeplerGlReducer
});

export default reducers;