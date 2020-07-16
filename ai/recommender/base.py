"""
Recommender system for Penn AI.
"""
import logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
ch = logging.StreamHandler()
formatter = logging.Formatter('%(module)s: %(levelname)s: %(message)s')
ch.setFormatter(formatter)
logger.addHandler(ch)
import numpy as np
import os
import pdb 
import pickle
import gzip
import random
import hashlib
import copy
from pandas.util import hash_pandas_object

class BaseRecommender:
    """Base recommender for PennAI

    The BaseRecommender is not intended to be used directly; it is a skeleton class
    defining the interface for future recommenders within the PennAI project.

    Parameters
    ----------
    ml_type: str, 'classifier' or 'regressor'
        Recommending classifiers or regressors. Used to determine ML options.

    metric: str (default: accuracy for classifiers, mse for regressors)
        The metric by which to assess performance on the datasets.

    ml_p: DataFrame (default: None)
        Contains all valid ML parameter combos, with columns 'algorithm' and
        'parameters'

    filename: string or None
        Name of file to load

    knowledgebase: Pandas DataFrame or None
        Used in some recommenders to load from saved state
    """

    def __init__(self, ml_type='classifier', metric=None, ml_p=None,
            random_state=None, filename=None, knowledgebase=None):
        """Initialize recommendation system."""
        if ml_type not in ['classifier', 'regressor']:
            raise ValueError('ml_type must be "classifier" or "regressor"')

        self.random_state = random_state
        if self.random_state is not None:
            random.seed(self.random_state)
            np.random.seed(self.random_state)

        logger.info('self.random_state: ' + str(self.random_state))

        self.ml_type = ml_type
        
        if metric is None:
            self.metric='bal_accuracy' if self.ml_type=='classifier' else 'mse'
        else:
            self.metric = metric

        # maintain a set of dataset-algorithm-parameter combinations that have 
        # already been evaluated
        self.trained_dataset_models = set()
        # hash table for parameter options
        self.hash_2_param = {}
        
        # get ml+p combos (note: this triggers a property in base recommender)
        self.ml_htable = {}
        self.ml_p = ml_p

        # set a filename for loading and saving the recommender state
        self.filename = filename
        if self.filename is not None:
            self.load(self.filename, knowledgebase)

    def _default_saved_recommender_filename(self):
        ### Generate the default name of the serialaized instance of this recommender

        # Hardcoading the informal kb descriptor for now, this should be changed.
        return (
            self.__class__.__name__
            + '_' + self.ml_type
            + '_' + self.metric
            + '_pmlb_20200505'
            +'.pkl.gz')


    def _generate_saved_recommender_path(self, 
        saved_recommender_filename=None,
        saved_recommmender_directory=None):
        """ Generate the path for the saved recommender

        Parameters
        ----------
        saved_recommender_filename
        saved_recommmender_directory
        """
        assert not(
            saved_recommender_filename == None and saved_recommmender_directory == None)

        # dynamic default values
        saved_recommmender_directory = saved_recommmender_directory or "."
        saved_recommender_filename = saved_recommender_filename or self._default_saved_recommender_filename()

        return os.path.join(saved_recommmender_directory, saved_recommender_filename)


    def update(self, results_data, results_mf=None, source='pennai'):
        """Update ML / Parameter recommendations.

        Parameters
        ----------
        results_data: DataFrame 
            columns corresponding to:
            'algorithm'
            'parameters'
            self.metric

        results_mf: DataFrame, optional 
            columns corresponding to metafeatures of each dataset in 
            results_data.

        source: string
            if 'pennai', will update tally of trained dataset models 
        """
        if results_data.isna().values.any():
            logger.warning('There are NaNs in results_data.')
            #logger.warning(str(results_data))
            logger.warning(results_data.head())
            logger.error('Dropping NaN results.')
            results_data.dropna(inplace=True) 

        # update parameter hash table
        logger.info('updating hash_2_param...')
        self.hash_2_param.update(
                {self._param_hash(x):x 
                for x in results_data['parameters'].values})
        param_2_hash = {frozenset(v.items()):k 
                for k,v in self.hash_2_param.items()} 
        # store parameter_hash variable in results_data 
        logger.info('storing parameter hash...')
        results_data['parameter_hash'] = results_data['parameters'].apply(
                lambda x: param_2_hash[frozenset(x.items())])
       
        # update results list 
        if source == 'pennai':
            self._update_trained_dataset_models_from_df(results_data)

    def _param_hash(self, x):
        """Provides sha256 hash for parameter dictionary."""
        hasher = hashlib.sha256()
        hasher.update(repr(tuple(sorted(x.items()))).encode())
        return hasher.hexdigest()

    def recommend(self, dataset_id=None, n_recs=1, dataset_mf=None):
        """Return a model and parameter values expected to do best on dataset.

        Parameters
        ----------

        dataset_id: string
            ID of the dataset for which the recommender is generating 
            recommendations.
        n_recs: int (default: 1), optional
            Return a list of length n_recs in order of estimators and parameters 
            expected to do best.
        dataset_mf: DataFrame 
            metafeatures of the dataset represented by dataset_id
        """
        # self.dataset_id_to_hash.update(
        #         {dataset_id:dataset_mf['_id'].values[0]})

    def load(self, filename=None, knowledgebase=None):
        """Load a saved recommender state.

        :param filename: string or None
            Name of file to load
        :param knowledgebase: string or None
            DataFrame with columns corresponding to:
                'dataset'
                'algorithm'
                'parameters'
                self.metric
        """
        if filename is None:
            fn = self.filename
        else:
            fn = filename

        if os.path.isfile(fn):
            logger.info('loading recommender ' + fn + ' from file')
            f = gzip.open(fn, 'rb')
            tmp_dict = pickle.load(f)
            f.close()

            # check if parameters match, if not throw warning/error
            for k,v in tmp_dict.items():
                if k in self.__dict__.keys():
                    if type(self.__dict__[k]) in [str, int, bool, float]:
                        if self.__dict__[k] != tmp_dict[k]:
                            logger.warn(k+' changing from '
                                    + str(self.__dict__[k])[:20] + '... to '
                                        + str(tmp_dict[k])[:20] + '...')
                else:
                    logger.warn('adding ' + k+'=' + str(tmp_dict[k])[:20]
                            + '...')
            logger.info('updating internal state')
            
            # check ml_p hashes
            rowHashes = hash_pandas_object(self.ml_p.apply(str)).values 
            newHash = hashlib.sha256(rowHashes).hexdigest()
            if 'ml_p_hash' in tmp_dict.keys():
                if newHash == tmp_dict['ml_p_hash']:
                    logger.info('ml_p hashes match')
                else:
                    error_msg = ('the ml_p hash from the pickle is different.'
                        'This likely means the algorithm configurations have '
                        'changed since this recommender was saved. You should '
                        'update and save a new one.')
                    logger.error(error_msg)
                    raise ValueError(error_msg)
                del tmp_dict['ml_p_hash']

            # update self with loaded pickle
            self.__dict__.update(tmp_dict)
            return True
        else:
            logger.warning('Could not load filename '+self.filename)
            return False


    def save(self, filename=None):
        """Save the current recommender.
        
        :param filename: string or None
            Name of file to load
        """
        if filename is None:
            fn = self.filename
        else:
            fn = filename
        if os.path.isfile(fn):
            logger.warning('overwriting ' + fn)

        # remove ml_p to save space 
        save_dict = copy.deepcopy(self.__dict__)
        rowHashes = hash_pandas_object(save_dict['_ml_p'].apply(str)).values 
        save_dict['ml_p_hash'] = hashlib.sha256(rowHashes).hexdigest() 
        del save_dict['_ml_p']
        del save_dict['mlp_combos']

        logger.info('saving recommender as ' + fn)
        f = gzip.open(fn, 'wb')
        pickle.dump(save_dict, f, 2)
        f.close()

    def update_and_save(self, results_data, results_mf=None, source='pennai',
            filename=None):
        """runs self.update() and self.save.

        Parameters
        ----------
        results_data: DataFrame 
            columns corresponding to:
            'algorithm'
            'parameters'
            self.metric

        results_mf: DataFrame, optional 
            columns corresponding to metafeatures of each dataset in 
            results_data.

        source: string
            if 'pennai', will update tally of trained dataset models 
        """
        self.update(results_data, results_mf, source)
        self.save(filename)

    @property
    def ml_p(self):
        logger.debug('getting ml_p')
        return self._ml_p

    @ml_p.setter
    def ml_p(self, value):
        logger.debug('setting ml_p')
        if value is not None:
            #filter out SVC (temporary)
            self._ml_p = value
            logger.debug('setting hash table')
            # maintain a parameter hash table for parameter settings
            self.hash_2_param = {
                    self._param_hash(x):x
                    for x in self._ml_p['parameters'].values}
            param_2_hash = {frozenset(v.items()):k 
                    for k,v in self.hash_2_param.items()}
            # machine learning - parameter combinations
            self.mlp_combos = (self._ml_p['algorithm']+'|'+
                               self._ml_p['parameters'].apply(lambda x:
                                   param_2_hash[frozenset(x.items())]))
            # filter out duplicates
            self.mlp_combos = self.mlp_combos.drop_duplicates()
            # set ml_htable
            if 'alg_name' in value.columns:
                self.ml_htable = {
                        k:v for v,k in zip(value['alg_name'].unique(),
                        value['algorithm'].unique())
                        }
        else:
            logger.warning('value of ml_p is None')
        logger.debug('param_2_hash:{} objects'.format(len(param_2_hash)))

    def _update_trained_dataset_models_from_df(self, results_data):
        '''stores the trained_dataset_models to aid in filtering repeats.'''
        results_data.loc[:, 'dataset-algorithm-parameters'] = (
                                       results_data['_id'].values + '|' +
                                       results_data['algorithm'].values + '|' +
                                       results_data['parameter_hash'].values)

        for i,phash in enumerate(results_data['parameter_hash'].values):
            if phash not in self.hash_2_param.keys():
                logger.error(phash
                        +' not in self.hash_2_param. parameter values: '
                        + str(results_data['parameters'].values[i]))
        # get unique dataset / parameter / classifier combos in results_data
        d_ml_p = results_data['dataset-algorithm-parameters'].unique()
        self.trained_dataset_models.update(d_ml_p)
        
    def _update_trained_dataset_models_from_rec(self, dataset_id, ml_rec, 
            phash_rec):
        '''update the recommender's memory with the new algorithm-parameter 
        combos that it recommended'''
        if dataset_id is not None:
            # datahash = self.dataset_id_to_hash[dataset_id]
            self.trained_dataset_models.update(
                                    ['|'.join([dataset_id, ml, p])
                                    for ml, p in zip(ml_rec, phash_rec)])
