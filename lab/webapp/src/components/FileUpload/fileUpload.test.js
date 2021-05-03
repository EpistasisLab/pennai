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
import FileUpload from './';
//import SceneHeader from '../SceneHeader';
// try getting react pieces and framework for test rendering
import React from 'react';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

const middlewares = [thunk];
const initialState = {};
const mockStore = configureStore(middlewares);

import { shallow, mount, render, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
configure({ adapter: new Adapter() });


//// NOTE on getting state
//
// The enzyme wrapper method 'state' (and related methods) is not working on mount(<my component>).
// I think it's because the component is wrapped with redux connect().
// So you can use shallow(<my component>).dive().state(),
//  or more direclty shallow(<my component>).dive().instance().state
// I don't know which is better.
//
describe('basic testing of fileupload react component', () => {
  let store = mockStore(initialState);
  let fullDom;
  let shallowDom;
  let instance;
  let badFakeFile = {name: 'iris.txt'};
  // basic bookkeeping before/after each test; mount/unmount component, should be
  // similar to how piece will actually work in browser
  beforeEach(() => {
    fullDom = mount(<FileUpload store={store} testProp='hello' />);
    //NOTE with react-redux, need 'dive()' to get the 'true' (not sure of the term) component instance.
    shallowDom = shallow(<FileUpload store={store}/>).dive();
    instance = shallowDom.instance();
  })
  afterEach(() => {
    fullDom.unmount();
  })

  //test that the componement instance is viable
  //NOTE 'it' is an alias for 'test'
  it('DONE - test instance', () => {
    expect(instance).not.toEqual(null);
    //Test calling a method on the instance
    expect(instance.instanceTest()).toEqual('foobar');
    //Test retrieving state from the instance. See note above about accessing state.
    expect(instance.state.testStateValue).toEqual('foobar');
    expect(shallowDom.state('testStateValue')).toEqual('foobar');
  })

  // test for existence
  it('DONE - fileupload component, test for existence', () => {
    //console.log('jest console log!'); //this works, outputs to console at test script runtime
    // Find the component itself
    expect(fullDom.find(FileUpload)).toHaveLength(1);
    fullDom.setProps({ name: 'bar' });
    expect(fullDom.name()).toEqual('Connect(FileUpload)');
    expect(fullDom.props().testProp).toEqual('hello');
    expect(fullDom.props().name).toEqual('bar');
  })

  //snapshot of component
  //I believe shallow is better since it won't include child components
  it('DONE - full component snapshot', () => {
    expect(shallow(<FileUpload store={store}/>).dive()).toMatchSnapshot();
  })

  // the intended behavior of this component is to hide the fields to enter info
  // about the file being uploaded until a file with a testFilename has been selected
  it('DONE - check UI form is hidden w/o a file selection', () => {
    let formBody = shallowDom.find('#file-upload-form-input-area');
    expect(formBody.length).toEqual(1)

    // check for CSS style which hides form
    expect(formBody.hasClass('file-upload-form-hide-inputs')).toEqual(true);
    expect(formBody.hasClass('file-upload-form-show-inputs')).toEqual(false);
  })
  
  it('TODO - try selecting non-csv/tsv file type', () => {

    let dropzoneButton = fullDom.find("#file-dropzone");
    expect(dropzoneButton).toHaveLength(1);
    // Simulate callback receiving bad file obj
    dropzoneButton.at(0).prop('onDropAccepted')([badFakeFile]);
    // Should not have changed file object
    expect(shallowDom.state('selectedFile')).toBeNull();
    // Check the UI isn't showing for file specifications
    let formBody = fullDom.find('#file-upload-form-input-area');
    // check for CSS style which hides form
    expect(formBody.hasClass('file-upload-form-hide-inputs')).toEqual(true);
    expect(formBody.hasClass('file-upload-form-show-inputs')).toEqual(false);
  })
    
}) //describe

// Test various functionality with a file blob that
// simulates actual data loaded
describe('series of tests with mock file blob', () => {
  let store = mockStore(initialState);
  let fullDom;
  let shallowDom;
  let instance;

  // Create a test blob.
  // Simulates raw data loaded by file I/O, before it's parsed as csv data.
  //
  let featureNames=['col1','col2','class','col3'];
  let depColumnIndex = 2;
  // The data, with each feature as a row
  let dataByFeature = [
    ['one','three','two','one'], //column 0
    ['cat','dog','cat','bird'],  //column 1, etc..
    [1,2,3,2.5],
    ['yes','no','yes','42']
  ]
  // Make CSV version of data
  let dataCSV = featureNames.join()+`\n`;
  for(let row=0; row < dataByFeature[0].length; row++) {
    let line = "";
    for(let col=0; col < featureNames.length; col++) {
      line += dataByFeature[col][row];
      if(col < (featureNames.length-1))
        line += ','
    }
    line += '\n';
    dataCSV += line;
  }

  let catFeaturesOrig = [featureNames[0],featureNames[1],featureNames[3]];
  let testFilename = 'testFile.csv';
  let blob = new Blob([dataCSV], {type: 'text/csv'});
  blob.lastModifiedDate = new Date();
  let testFileBlob = new File([blob], testFilename);

  function getFeatureTypesDefault(){
    return [instance.featureTypeCategorical, instance.featureTypeCategorical, instance.featureTypeNumeric, instance.featureTypeCategorical];
  }

  // Helper method
  function setAllFeaturesToDefaults() {
    instance.clearDependentFeature();
    instance.setAllFeatureTypes('autoDefault');
    // This will clear the previous value of ordinal features that's otherwise stored.
    instance.ordinalFeaturesClearToDefault(true);
    // Set predicition type
    instance.setState(  {
      predictionType: instance.defaultPredictionType,
    });
    shallowDom.update();
  }

  // Helper method so this is kept in one place
  // typeOrArray - type string to expect all to be, or 'default' for auto defaults, or array of types
  function testFeatureTypes(typeOrArray)
  {
    let testArray;
    if(Array.isArray(typeOrArray)){
      testArray = typeOrArray;
    }
    else {
      if(typeOrArray === 'default'){
        testArray = getFeatureTypesDefault();
      }
      else{
        testArray = [0,0,0,0];
        testArray.fill(typeOrArray);
      }
    }
    //Don't test in a loop, it makes error reporting harder to understand
    expect(featureNames.length).toBe(4);
    expect(testArray.length).toBe(4);
    expect(instance.getFeatureType(featureNames[0])).toEqual(testArray[0]);
    expect(instance.getFeatureType(featureNames[1])).toEqual(testArray[1]);
    expect(instance.getFeatureType(featureNames[2])).toEqual(testArray[2]);
    expect(instance.getFeatureType(featureNames[3])).toEqual(testArray[3]);
  }

  // Return obj { result: true if error modal is showing, header: header string, content: content string }
  function errorModalIsShowing() {
    let res = {
      result: shallowDom.find("#error_modal_dialog").length > 0 && shallowDom.find("#error_modal_dialog").at(0).prop('open'),
      header: instance.state.errorModalHeader,
      content: instance.state.errorModalContent
    }
    return res;
  }

  function closeErrorModal() {
    // I first tried these methods to simulate user UI actions
    // to close the error modal, but they're not working.
    //shallowDom.find("#error_modal_dialog").at(0).simulate('keydown', {keyCoode: 27});
    //shallowDom.find("#file-upload-form-input-area").at(0).simulate('click');
    //shallowDom.find(".close").at(0).simulate('click'); //tries to find the close icon on the modal, but it fails
    instance.handleErrorModalClose();
    shallowDom.update();
  }

  // Use beforeAll so that the blob stays loaded w/out having
  // to do all the tests in the mocked callback below.
  beforeAll(() => {
    fullDom = mount(<FileUpload store={store} />);
    shallowDom = shallow(<FileUpload store={store}/>).dive();
    instance = shallowDom.instance();
  })
  afterAll(() => {
    fullDom.unmount();
  })

  it('----------- dummy test to force fail', () => {
    expect('foo').toEqual('bar');
  })

  // DO THIS TEST FIRST for this group of tets.
  // Load the simulated file blob. Handles async behavior. 
  it('DONE - load simulated file blob', done => {
    // Mock the method FileUpload.handleSelectedFileCompletedStub for unit testing.
    // It gets called when file blob
    // is loaded successfully, just for unit testing since the file loader
    // calls a callback when complete, and thus otherwise wouldn't be
    // handled before this test copmletes. The 'done' method here is
    // provided by jest to handle async testing.
    // Messy but it works.
    const mockcb = jest.fn( () => { 
      // Test that it finished loading successfully
      expect(mockcb.mock.calls.length).toBe(1);
      
      // Test that the file object is set
      expect(instance.state.selectedFile.name).toEqual(testFilename); 

      // Tell jest we're done with this test. 
      done();       
    });
    instance.handleSelectedFileCompletedStub = mockcb;

    // Load file obj directly via handler
    instance.handleSelectedFile([testFileBlob]);
  }, 15000/* long timeout just in case*/)

  // ** NOTE **
  // Subsquent tests rely on the wrapper from above still being loaded
  // and having the test file blob loaded.

  it('test features states after file blob load', () => {
    // Verify error modal is not showing
    expect(errorModalIsShowing().result).toBe(false);

    // Test the auto-assigned feature types and getFeatureType()
    // Expect dep. column to be set
    let expected = getFeatureTypesDefault();
    expected[depColumnIndex] = instance.featureTypeDependent;
    testFeatureTypes(expected);
    
    // No ordinal features should be specified. Object should be empty
    expect(instance.state.ordinalFeaturesObject).toEqual({});

    // Dependent column should be set to column with name 'class' after load, 
    // because the name 'class' is used to auto-detect dependent column
    expect(instance.getDependentColumn()).toEqual(featureNames[depColumnIndex]);

    // Set all features to default type and check. This will
    // clear dependent column.
    setAllFeaturesToDefaults();
    testFeatureTypes('default');
  })

  it('DONE - test feature assignment behaviors via direct manipulation', () => {
    // Test assigning a categorical feature to type numeric.
    // Should silently reject and not change to numeric.
    instance.setFeatureType(featureNames[0], instance.featureTypeNumeric);
    expect(instance.getFeatureType(featureNames[0])).toEqual(instance.featureTypeCategorical);

    // Test getting array of categorical features
    let catFeatures = [...catFeaturesOrig];
    expect(instance.getCatFeatures()).toEqual(catFeatures);

    // Set ordinal feature, w/out specifying rank
    let ordFeature = featureNames[0];
    instance.setFeatureType(ordFeature, instance.featureTypeOrdinal);
    expect(instance.getFeatureType(ordFeature)).toEqual(instance.featureTypeOrdinal);
    let ordsExpected = {[ordFeature]: ["one","three","two"]};
    expect(instance.state.ordinalFeaturesObject).toEqual(ordsExpected);
    // Should not be included as a categorical feature
    catFeatures = catFeatures.filter( val => val !== ordFeature); //remove ordinal feature
    expect(instance.getCatFeatures().find(el => el === ordFeature)).toEqual(undefined);

    // Reset to default types, unset dependent, and verify
    setAllFeaturesToDefaults();
    testFeatureTypes('default');

    // Set all to ordinal
    // Note that features that default to numeric can still be set as categorical or ordinal
    instance.setAllFeatureTypes(instance.featureTypeOrdinal);
    testFeatureTypes(instance.featureTypeOrdinal);
    
    // Set all to categorical
    instance.setAllFeatureTypes(instance.featureTypeCategorical);
    testFeatureTypes(instance.featureTypeCategorical);

    // Set all to numeric
    // This should not set default-categorical types to numeric. They should be left as-is.
    instance.setAllFeatureTypes(instance.featureTypeNumeric);
    testFeatureTypes('default'); // Should now all equal default types because of how I've structured the test up to here

    // Invalid feature names should be handled properly
    expect(instance.validateFeatureName('The Spanish Inquisition')).toEqual(false);
    // Should return default type for invalid feature name
    expect(instance.getFeatureType('xkcd4eva')).toEqual(instance.featureTypeDefault);
    expect(instance.getFeatureDefaultType('Frank the Furter')).toEqual(instance.featureTypeDefault);
  })

  it('DONE - test dependent feature and prediction type behaviors via direct manipulation', () => {
    //Reset feature types
    setAllFeaturesToDefaults();
    
    // Dependent feature should be unset
    expect(instance.getDependentColumn()).toEqual(undefined);
    
    // Assigning dependent feature
    let dep1 = featureNames[2];
    instance.setFeatureType(dep1, instance.featureTypeDependent);
    expect(instance.getFeatureType(dep1)).toEqual(instance.featureTypeDependent);
    expect(instance.getDependentColumn()).toEqual(dep1);
    
    // Reassigning dependent feature should reset the previous one
    // to its default type
    let dep2 = featureNames[3];
    instance.setFeatureType(dep2, instance.featureTypeDependent);
    expect(instance.getFeatureType(dep2)).toEqual(instance.featureTypeDependent);
    expect(instance.getDependentColumn()).toEqual(dep2);
    expect(instance.getFeatureType(dep1)).toEqual(instance.getFeatureDefaultType(dep1));

    // Dependent column should no longer be included as categorical
    //expect(instance.getCatFeatures().find(el => el === dep2)).toEqual(undefined);
    expect(instance.getCatFeatures()).not.toContain(dep2);

    // Prediction type - should be set to default
    expect(instance.state.predictionType).toEqual(instance.defaultPredictionType);
  })

  // Test the methods used by the dialogs for text-based specification of
  // categorical feature types
  it('test text-based categorical-type specification', () => {
    // Helper to simulate opening dialog, entering text and then accepting it
    // cancel - pass true to cancel the input instead of accepting
    function updateCatText(text, cancel = false) {
      // Open the dialog
      let openButton = shallowDom.find("#cat_features_text_input_open_button");
      expect(openButton.length).toEqual(1);
      openButton.at(0).simulate('click');
      // Get the text input element
      let textInput = shallowDom.find("#categorical_features_text_area_input");
      expect(textInput.length).toEqual(1);
      // Simulate text input event
      let event = {target: {value: text}};
      textInput.at(0).prop('onChange')(event); // stores text to state
      textInput.at(0).prop('onBlur')(event); // stores text as raw to state
      // Simulate button press
      if(cancel)
        shallowDom.find("#cat_features_user_text_cancel_button").at(0).simulate('click'); //uses state vars
      else
        shallowDom.find("#cat_features_user_text_accept_button").at(0).simulate('click'); //uses state vars
      shallowDom.update();
    }

    // Close the cat feature text input dialog
    function closeCatText() {
      let button = shallowDom.find("#cat_features_user_text_cancel_button");
      if(button.length > 0) {
        button.at(0).simulate('click'); //uses state vars
      }
    }

    //Reset feature types to dfault
    setAllFeaturesToDefaults();

    // Should all be default still after empty string
    updateCatText("");
    expect(errorModalIsShowing().result).toBe(false);
    testFeatureTypes('default');

    // Assign single feature (that's already categorical) via text. 
    // This shouldn't change anything because other features that default to categorical
    // will stay as such.
    updateCatText(catFeaturesOrig[0]); 
    expect(errorModalIsShowing().result).toBe(false);
    testFeatureTypes('default');

    // Change text to set all features as categorical, but hit cancel button.
    // Shouldn't change feature assignments.
    updateCatText(featureNames.join(), true /*simulate clicking cancel button*/);
    expect(errorModalIsShowing().result).toBe(false);
    testFeatureTypes('default');

    // Assign all as categorical by passing string of all feature names
    updateCatText(featureNames.join());
    expect(errorModalIsShowing().result).toBe(false);
    testFeatureTypes(instance.featureTypeCategorical);

    // Assign just default-categorical again, and the one default-numeric feature
    // should revert to numeric
    updateCatText(featureNames.join()); // set all to type cat
    updateCatText(catFeaturesOrig.join()); // leaves out those not cat by default
    expect(errorModalIsShowing().result).toBe(false);
    testFeatureTypes('default');

    // Reset
    setAllFeaturesToDefaults();

    // Test with range - set all to categorical
    updateCatText(featureNames[0]+"-"+featureNames[3]);
    expect(errorModalIsShowing().result).toBe(false);
    testFeatureTypes(instance.featureTypeCategorical);

    // Test with smaller range. Should set all to categorical
    instance.setAllFeatureTypes(instance.featureTypeOrdinal);
    updateCatText(featureNames[0]+","+featureNames[1]+"-"+featureNames[2]+","+featureNames[3]);
    expect(errorModalIsShowing().result).toBe(false);
    testFeatureTypes(instance.featureTypeCategorical);
    
    // Test with bad string. Should see error modal and unchanged feature types
    setAllFeaturesToDefaults();
    updateCatText("woogie woogie");
    expect(errorModalIsShowing().result).toBe(true);
    closeErrorModal();
    closeCatText();
    testFeatureTypes('default');

    // Test with a bad range at begin
    setAllFeaturesToDefaults();
    updateCatText("frankenNoodle-"+featureNames[3]);
    expect(errorModalIsShowing().result).toBe(true);
    closeErrorModal();
    closeCatText();
    testFeatureTypes('default');

    // Test with a bad range at end
    setAllFeaturesToDefaults();
    updateCatText(featureNames[0]+"-frankenNoodle");
    expect(errorModalIsShowing().result).toBe(true);
    closeErrorModal();
    closeCatText();
    testFeatureTypes('default');

    // Test with setting dependent feature.
    // The dependent feature should not change when its feature is entered in text input,
    // and we should see error dialog.
    instance.setFeatureType(featureNames[0], instance.featureTypeDependent);
    updateCatText(catFeaturesOrig.join());
    expect(errorModalIsShowing().result).toBe(true);
    closeErrorModal();
    closeCatText();
    let expected = [...getFeatureTypesDefault()];
    expected[0] = instance.featureTypeDependent;
    testFeatureTypes(expected);

  })

  // Test the methods used by the dialogs for text-based specification of
  // ordinal feature types and ordinal ranking
  it('test text-based ordinal-type specification', () => {
    //Reset feature types to dfault
    setAllFeaturesToDefaults();


    // Simulate entering text and then accepting it.
    // cancel - pass true to simulate clicking the cancel button in text entry box.
    function updateOrdText(text, cancel = false) {
      // Open the dialog
      let openButton = shallowDom.find("#ord_features_text_input_open_button");
      expect(openButton.length).toEqual(1);
      openButton.at(0).simulate('click');
      // Get the text input element
      let textInput = shallowDom.find("#ordinal_features_text_area_input");
      expect(textInput.length).toEqual(1);
      // Simulate text change event
      let event = {target: {value: text}};
      textInput.at(0).prop('onChange')(event); // stores text to state
      shallowDom.update();
      if(cancel)
        shallowDom.find("#ordinal_features_user_text_cancel_button").at(0).simulate('click'); //uses state vars to process text
      else
        shallowDom.find("#ordinal_features_user_text_accept_button").at(0).simulate('click'); //uses state vars to process text
      shallowDom.update();
    }

    function closeOrdText() {
      let button = shallowDom.find("#ordinal_features_user_text_cancel_button");
      if(button.length > 0){
        button.at(0).simulate('click'); //uses state vars to process text
      }
    }

    // Should all be default still after empty string
    setAllFeaturesToDefaults();
    updateOrdText("");
    expect(errorModalIsShowing().result).toBe(false);
    testFeatureTypes('default');

    // Test invalid feature name. Shouldn't change feature assignments
    setAllFeaturesToDefaults();
    updateOrdText("knights,ni");
    expect(errorModalIsShowing().result).toBe(true);
    closeErrorModal();
    closeOrdText();
    testFeatureTypes('default');

    // Test valid feature name, but invalid values
    setAllFeaturesToDefaults();
    updateOrdText("col1,ni");
    expect(errorModalIsShowing().result).toBe(true);
    closeErrorModal();
    closeOrdText();
    testFeatureTypes('default');

    // Test canceling input. Feature types should not change.
    setAllFeaturesToDefaults();
    updateOrdText("col1,ni", true);
    expect(errorModalIsShowing().result).toBe(false);
    testFeatureTypes('default');

    // Test valid feature name and values,
    // test that ordinal value is correct in state
    setAllFeaturesToDefaults();
    updateOrdText("col1,one,two,three");
    expect(errorModalIsShowing().result).toBe(false);
    let expected = [...getFeatureTypesDefault()];
    expected[0] = instance.featureTypeOrdinal;
    testFeatureTypes(expected);
    let ords = { col1: ['one','two','three']};
    expect(instance.state.ordinalFeaturesObject).toEqual(ords);

    // Test two valid features names and values
    setAllFeaturesToDefaults();
    updateOrdText("col1,one,two,three\ncol2,bird,cat,dog");
    expect(errorModalIsShowing().result).toBe(false);
    expected = [...getFeatureTypesDefault()];
    expected[0] = instance.featureTypeOrdinal;
    expected[1] = instance.featureTypeOrdinal;
    testFeatureTypes(expected);
    ords = { col1: ['one','two','three'], col2: ['bird','cat','dog']};
    expect(instance.state.ordinalFeaturesObject).toEqual(ords);

    // Test one valid feature and values, one invalid featuare
    setAllFeaturesToDefaults();
    updateOrdText("col1,one,two,three\nunassumingduck,bird,cat,dog");
    expect(errorModalIsShowing().result).toBe(true);
    closeErrorModal();
    closeOrdText();
    expect(instance.state.ordinalFeaturesObject).toEqual({});
    testFeatureTypes('default');

    // Test two valid features, one with valid values, one with invalid values
    setAllFeaturesToDefaults();
    updateOrdText("col1,one,two,three\ncol2,bird,cat,fish");
    expect(errorModalIsShowing().result).toBe(true);
    closeErrorModal();
    closeOrdText();
    expect(instance.state.ordinalFeaturesObject).toEqual({});
    testFeatureTypes('default');

    // Test valid feature name but that's set as dependent feature.
    // Expect an error and dependent feature not to be changed.
    setAllFeaturesToDefaults();
    instance.setFeatureType(featureNames[0], instance.featureTypeDependent);
    updateOrdText("col1,one,two,three");
    expect(errorModalIsShowing().result).toBe(true);
    closeErrorModal();
    closeOrdText();
    expected = [...getFeatureTypesDefault()];
    expected[0] = instance.featureTypeDependent;
    testFeatureTypes(expected);

    // Test setting a feature to ord (with a different ranking than above), and then clearing it by
    // changing input text to omit it.
    setAllFeaturesToDefaults();
    updateOrdText("col1,one,two,three\ncol2,bird,cat,dog");
    expect(errorModalIsShowing().result).toBe(false);
    updateOrdText("col2,cat,dog,bird");
    expect(errorModalIsShowing().result).toBe(false);
    ords = { col2: ['cat','dog','bird']};
    expect(instance.state.ordinalFeaturesObject).toEqual(ords);
    expected = [...getFeatureTypesDefault()];
    expected[1] = instance.featureTypeOrdinal;
    testFeatureTypes(expected);

    // Test setting feature to type ordinal via dropdown in dataset preview,
    // and then check that string in feature specification input box is correct.
    //
    // Get the dropdown input element for
    setAllFeaturesToDefaults();
    let featureDrop = shallowDom.find("#featureTypeDropdown-0");
    expect(featureDrop.length).toEqual(1);
    let index = 0;
    // Simulate setting its value
    featureDrop.at(index).simulate('change', 
      { target: { value: 'testval', name: 'testname' } },
      {value: instance.featureTypeOrdinal, customindexid: index}
    );
    // Expect the feature to be type ordinal now
    expected = [...getFeatureTypesDefault()];
    expected[index] = instance.featureTypeOrdinal;
    testFeatureTypes(expected);
    // Expect the default/orig ordering of values
    let ordsArr = ['one','three','two'];
    ords = { col1: ordsArr };
    expect(instance.state.ordinalFeaturesObject).toEqual(ords);
    // Expect the text string in the ordinal specification box to match
    let openButton = shallowDom.find("#ord_features_text_input_open_button");
    expect(openButton.length).toEqual(1);
    openButton.at(0).simulate('click');
    let ordTextInput = shallowDom.find("#ordinal_features_text_area_input");
    expect(ordTextInput.length).toEqual(1);
    let expectedString = featureNames[index] + ',' + ordsArr.join() + '\n';
    let value = ordTextInput.at(index).props().value;
    expect(value).toBe(expectedString);

    // cleanup double-check
    closeErrorModal();
    closeOrdText();
  })

  // Test UI elements directly to see that they hold the right values
  //
  it('test other UI elements', () => {
    // Reset feature types to default AND clears dependent column to undefined
    setAllFeaturesToDefaults();

    // Verify various dataset preview table values
    
    // Header row
    featureNames.forEach( (feature, index) => {
      // Verify column header label
      let label = shallowDom.find("#table_header_label_" + feature);
      expect(label.length).toEqual(1);
      // Empirically, the text assigned to the Segment component is
      // in the second child object.
      expect(label.at(0).props().children[1]).toEqual(featureNames[index]);
          
      // Verify correct feature types in dropdowns
      let drop = shallowDom.find("#featureTypeDropdown-" + index.toString());
      expect(drop.length).toEqual(1);
      expect(drop.at(0).props().value).toEqual(getFeatureTypesDefault()[index]);
    } )

    // Target/Dependent column 
    //
    // Set column via dropdown
    let targetDrop = shallowDom.find("#target_dropdown");
    expect(targetDrop.length).toEqual(1);
    // Simulate setting its value
    let index = 2;
    targetDrop.at(0).simulate('change', 
      { target: { value: 'testval', name: 'testname' } },
      {value: featureNames[index]}
    );
    let expected = getFeatureTypesDefault();
    expected[index] = instance.featureTypeDependent;
    testFeatureTypes(expected);

    // Expect a label of 'Target' instead of a dropdown in the data table preview
    let targetLabel = shallowDom.find("#featureTypeTargetLabel-" + index.toString());
    expect(targetLabel.length).toEqual(1);

    // Verify the data shown in table preview
    for( let row=0; row < dataByFeature[0].length; row++) {
      featureNames.forEach( (feature, index) => {
        let id = '#data_table_prev_' + row.toString() + '_' + feature;
        let data = shallowDom.find(id);
        // Empirically, TableCell component has one child that holds value
        expect(data.length).toEqual(1);
        expect(data.at(0).props().children.toString()).toEqual(dataByFeature[index][row].toString());
      })
    }
    
    // Prediction type dropdown
    // Should default to default prediction type
    let predDrop = shallowDom.find("#prediction_type_dropdown");
    expect(predDrop.length).toEqual(1);
    //TODO - figure out how to check currenty value of dropdown. It doesn't
    // work to check predDrop.at(0).props().value with this type of dropdown
    // which is part of a Field.
    //console.log('prepDrop ', predDrop.at(0).props().value);
    //
    // Set to type regression via event handler
    let newPredType = 'regression';
    predDrop.at(0).simulate('change', 
      { target: { value: 'testval', name: 'testname' } },
      {value: newPredType}
    );
    // Check that it's changed
    expect(instance.state.predictionType).toEqual(newPredType);

  })

  // Test the button/menu that sets all features to particular type
  // The 'Set-all-to' button.
  it('test set-all-features-to menu', () => {
    setAllFeaturesToDefaults();
    
    // Click the 'set-all-to' button and check that menu is open
    let button = shallowDom.find("#set_all_to_button");
    expect(button.length).toEqual(1);
    button.at(0).simulate('click');
    let menu = shallowDom.find("#set_all_to_menu");
    expect(menu.length).toEqual(1);
    expect(menu.at(0).props().open).toEqual(true);

    // Test set all to categorical
    let catMenu = shallowDom.find("#set_all_to_menu_categorical");
    expect(catMenu.length).toEqual(1);
    catMenu.at(0).simulate('click');
    testFeatureTypes(instance.featureTypeCategorical);

    // Test set all to ordinal
    let ordMenu = shallowDom.find("#set_all_to_menu_ordinal");
    expect(ordMenu.length).toEqual(1);
    ordMenu.at(0).simulate('click');
    testFeatureTypes(instance.featureTypeOrdinal);
    
    // Test set all to defaults
    let defMenu = shallowDom.find("#set_all_to_menu_default");
    expect(defMenu.length).toEqual(1);
    defMenu.at(0).simulate('click');
    testFeatureTypes('default');
    
  })

  // Test the routine that preapes data for uploading.
  // Does NOT test the actual uploading process, since
  // that's an integration test.
  it('test generate file data', () => {
    setAllFeaturesToDefaults();

    // Set the dependent column
    instance.setFeatureType(featureNames[depColumnIndex], instance.featureTypeDependent);
    // Change the prediction type
    let predType = 'regression';
    instance.setState( {predictionType: predType});
    shallowDom.update();
    // Set first feature to ordinal
    instance.setFeatureType(featureNames[0], instance.featureTypeOrdinal);

    let formData = instance.generateFileData();
    // Check results
    expect(formData.errorResp).toBeUndefined();
    expect(errorModalIsShowing().result).toEqual(false);
    // Get the metadata values
    let result = JSON.parse( formData.get('_metadata') );
    // Ordinals
    let ords = {};
    ords[featureNames[0]] = ['one','three','two'];
    expect(result['ordinal_features']).toEqual(ords);
    // Categoricals
    let cats= [ featureNames[1], featureNames[3] ];
    expect(result.categorical_features).toEqual(cats);
    // Prediction type
    expect(result.prediction_type).toEqual(predType);
    // Dependent column
    expect(result.dependent_col).toEqual(featureNames[depColumnIndex]);
    // Filename
    expect(result.name).toEqual(testFilename);

    // Test with bad prediction type.
    instance.setState( {
      predictionType: 'nice try buddy!',
      uploadButtonDisabled: false //hack
    });
    shallowDom.update();
    formData = instance.generateFileData();
    expect(formData.errorResp).toBeDefined();

    // Test again with the handleUpload method to test that error gets caught and handled.
    // Should get error modal.
    instance.handleUpload();
    shallowDom.update();
    expect(errorModalIsShowing().result).toEqual(true);
    closeErrorModal();

    // Test with undefined dependent column
    setAllFeaturesToDefaults(); //clears dep. column
    formData = instance.generateFileData();
    expect(formData.errorResp).toBeDefined();

    // Test again with handleUpload. Should get error modal
    instance.setState( {
      uploadButtonDisabled: false //hack for check that's done in handleUpload
    });
    shallowDom.update();
    instance.handleUpload();
    shallowDom.update();
    expect(errorModalIsShowing().result).toEqual(true);
    closeErrorModal();
  })
})