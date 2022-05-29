import React, { useCallback, useEffect, useState } from 'react';
import { FilterType, getFilterType } from '../../utils';
import styles from "./Filterbar.module.css";

const FilterSuggestionPanel = ( { suggestions, isIVolunteer, onSetNewFilterValue } ) => {  
    const [filterList, setFilterList] = useState([])
    const [showFilters, setShowFilters] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState();
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [newFilterValue, setNewFilterValue] = useState();

    // set and update filter list
    useEffect(() => {
        setFilterList(Object.keys(suggestions))
    }, [suggestions])
    
    // add new filter and give it back outside
    const newFilterCallback = useCallback(
        (value) => {
          setNewFilterValue(value);
          onSetNewFilterValue([value, true]);
        }, [newFilterValue, onSetNewFilterValue],
    );
    
    // render list to choose filter from
    let renderedFilterlist = null;
    if (showFilters) {
        renderedFilterlist = (
            <div className={`${styles.suggestionTextValuesPanel} ${styles.filterListPanel}`}>
                 { filterList.map((filter, index) => {
                      return <FilterListElement key={index} filterName={filter} 
                                setShowFilters={setShowFilters} 
                                filterList={filterList} setFilterList={setFilterList}
                                setSelectedFilter={setSelectedFilter}
                                setShowSuggestions={setShowSuggestions} />
                 })}
            </div>
        )
    }

    // after choosing filter, render list of suggestions
    let renderedSuggestionList = null;
    if (showSuggestions) {
        let filterSuggestions = getFilterSuggestions(isIVolunteer, suggestions, selectedFilter);
        renderedSuggestionList = (
            <FilterSuggestions filterKey={selectedFilter} filterValues={filterSuggestions} setNewFilterValue={newFilterCallback} setShowSuggestions={setShowSuggestions}></FilterSuggestions>
        )
    }

    return(
        <>
            {
                !showFilters && !showSuggestions && filterList.length > 0
                ?   <div className={`${styles.filterElement} ${styles.addFilterBtn}`} onClick={() => displayFilters(true, setShowFilters)}>
                        <span>Add filter</span>
                    </div>
                :   ''
            }
            <div>
                {renderedFilterlist}
            </div>
            <div>
                {renderedSuggestionList}
            </div>
        </>
    );
}

const FilterListElement = ( { filterName, setShowFilters, filterList, setFilterList, setSelectedFilter, setShowSuggestions } ) => {
    return (
        <>
            <div className={styles.suggestionValueElement} onClick={() => selectFilterName(filterName, setShowFilters, filterList, setFilterList, setSelectedFilter, setShowSuggestions)}>
                {filterName}
            </div>
        </>
    );
} 

const FilterSuggestions = ( { filterKey, filterValues, setNewFilterValue, setShowSuggestions } ) => {
    const keys = Object.keys(filterValues);
    const filterType = getFilterType(filterKey);
    return (
        <>
                {
                    filterType === FilterType.TEXT
                    ?   <div className={styles.suggestionsTextPanel}>
                            <div className={styles.suggestionFiltername}>{filterKey}:</div>  
                            <div className={styles.suggestionTextValuesPanel}>
                                {
                                    keys.map((valueKey: string) => (
                                        <div key={valueKey} className={styles.suggestionValueElement} onClick={() => selectFilterValue(setNewFilterValue, filterKey, filterValues[valueKey], setShowSuggestions)}>{filterValues[valueKey]}</div>
                                    ))
                                }
                            </div>
                        </div>
                    :   <div className={styles.suggestionsRangePanel}>
                            <div className={styles.suggestionFiltername}>{filterKey}:</div> 
                            <div className={styles.suggestionRangeValuesPanel}>
                                <div className={styles.suggestionRangeFilterLine}>
                                    <div className={styles.suggestionRangeValueLabel}>From:</div>
                                    <input className={styles.suggestionRangeValueInput} type='number' id='rangeFrom' min='0.05' max='1' step='0.05' onChange={() => onChangeRange()} defaultValue='0.50'></input>
                                </div>
                                <div className={styles.suggestionRangeFilterLine}>
                                    <div className={styles.suggestionRangeValueLabel}>To:</div>
                                    <input className={styles.suggestionRangeValueInput} type='number' id='rangeTo' min='0.05' max='1' step='0.05' onChange={() => onChangeRange()} defaultValue='1.0'></input>
                                </div>
                                <button className={styles.suggestionRangeBtn} id='rangeFilterConfirm' onClick={() => confirmRangeFilter(setNewFilterValue, filterKey, setShowSuggestions)}>Confirm</button>
                            </div>
                        </div>
                }
        </>
    );  
}

const displayFilters = (showFilters, setShowFilters: any) => {
    setShowFilters(showFilters);
}

const selectFilterName = (filterName, setShowFilters, filterList, setFilterList, setSelectedFilter, setShowFilterSuggestions) => {
    setShowFilters(false);
    setSelectedFilter(filterName);
    setShowFilterSuggestions(true);

    // remove filter from filterlist so it cannot be selected twice
    let elementIndex = filterList.indexOf(filterName);
    filterList.splice(elementIndex, 1);
    setFilterList(filterList);
}

const selectFilterValue = (setNewFilterValue, filterKey, filterValue, setShowSuggestions) => {
    setNewFilterValue({
        "key": filterKey,
        "value": filterValue
    });
    setShowSuggestions(false);
}

/**
 * get FilterKeys as a first step
 * 
 * @param suggestions
 * @returns 
 */
const getFilters = (suggestions) => {
    return Object.keys(suggestions);
}

/**
 * get all FilterValues. 
 * Also, handle multi-levelled hierarchies in filter values (e.g. regions/cities)
 * 
 * @param isIVolunteer 
 */
const getFilterSuggestions = (isIVolunteer: boolean, suggestions: any, filterKey) => {
    const filterType = getFilterType(filterKey);
    
    let values = {};
    if (isIVolunteer) {
        values = suggestions;
    } else {
        if (filterType === FilterType.TEXT) {
            if (filterKey === 'region') {
                let tempValues = {};
                for (let countryKey in suggestions[filterKey].properties) {
                    for (let regionKey in suggestions[filterKey].properties[countryKey]) {
                        tempValues[regionKey] = suggestions[filterKey].properties[countryKey][regionKey]; 
                    }
                }
                values = tempValues;
            } else if (filterKey === 'city') {
                let tempValues = {};
                for (let countryKey in suggestions[filterKey].properties) {
                    for (let regionKey in suggestions[filterKey].properties[countryKey]) {
                        for (let cityIndex = 0; cityIndex < suggestions[filterKey].properties[countryKey][regionKey].length; cityIndex++) {
                            tempValues[regionKey + "/" + cityIndex] = suggestions[filterKey].properties[countryKey][regionKey][cityIndex].name; 
                        }
                    }
                }
                values = tempValues;
            } else {
                values = suggestions[filterKey].properties;
            }
        }
    }

    return values;
}

const onChangeRange = () => {
    $('#rangeFilterConfirm').prop('disabled', true);

    let from = $('#rangeFrom').val();
    let to = $('#rangeTo').val();

    // enable button when both fields are filled and from < to
    if (from !== '' && to !== '') {
        if (from < to || from === to) {
            $('#rangeFilterConfirm').prop('disabled', false);
        }
    }
}

const confirmRangeFilter = (setNewFilterValue, filterKey, setShowSuggestions) => {
    let from = $('#rangeFrom').val();
    let to = $('#rangeTo').val();

    // confirm only works when both fields are filled and from < to
    if (from !== '' && to !== '') {
        if (from < to || from === to) {
            setNewFilterValue({
                "key": filterKey,
                "value": [from, to]
            });
            setShowSuggestions(false);
        }
    }
}

export default FilterSuggestionPanel;