/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
/*************************************************************************************************************************
 * Touchstone Merchandise Group-USA-NS
 * 
 * ${TSMG-74} : ${Automate CSV import  for RF-SMART Item Bin Enhancement}
 * 
 *********************************************************************************************************************
 *
 * Author: Jobin & Jismi
 * 
 * Date Created : 06-September-2023
 * 
 * Description :This Map reduce script is used for automating the creation or updation of the custom record "RF-SMART Item Bin Enhancement" associated with Inventory items.
 *
 * REVISION HISTORY
 *
 * @version 1.0 TSMG-75 : 06-September-2023 : Scheduled script development for automating CSV import- Created the initial build by JJ0170
 * 
 **************************************************************************************************************************/
define(['N/record', 'N/search'],
    /**
 * @param{record} record
 * @param{search} search
 */
    (record, search) => {
        "use strict";
        const MAIN = {
            /**
            * Function to check whether the given parameter argument has value on it or is it empty.
            * @param {*} parameter - parameter which contains/references some values
            * @returns {boolean} - true if there exist a value else false
            */
            checkForParameter(parameter) {
                try {
                    if (parameter !== "" && parameter !== null && parameter !== undefined && parameter !== false && parameter !== "null" && parameter !== "undefined" && parameter !== " " && parameter !== 'false') {
                        return true;
                    }
                    else {
                        return false;
                    }
                }
                catch (e) {
                    log.error("Error @ checkForParameter", e);
                    return false;
                }
            },

            /**
             * Function to search for the list of inventory items for RF-SMART Item Bin Enhancement custom record creation or updation
             * @returns {Array} - inventoryItemSearchArray - Array of objects containg inventory item details
             */
            fetchInventoryItems() {
                try {
                    let inventoryItemSearchArray = [];
                    let inventoryItemSearchObj = search.create({
                        type: "item",
                        filters:
                            [
                                ["type", "anyof", "InvtPart"],
                                "AND",
                                ["isinactive", "is", "F"],
                                "AND",
                                ["preferredbin", "is", "T"],
                                "AND",
                                ["formulanumeric: case when {binnumber}={custrecord_rfs_replenishment_rule_item.custrecord_rfs_replenishment_rule_bin} then 1 else 0 end", "equalto", "0"],
                                "AND",
                                ["formulatext: {binnumber}", "doesnotstartwith", "Retail"],
                                "AND",
                                ["formulatext: {binnumber}", "doesnotstartwith", "MF"],
                                "AND",
                                ["formulatext: {binnumber}", "doesnotstartwith", "Mezz"],
                                "AND",
                                ["binnumber.inactive", "is", "F"],
                                "AND",
                                ["formulatext: {name}", "doesnotstartwith", "PRT"],
                                "AND",
                                ["binnumber.location", "anyof", "7"],
                                "AND",
                                ["custitemtmg_program_name.custrecord_closedprogram", "is", "F"],
                                "AND",
                                ["custitemtmg_program_name", "noneof", "102", "11", "103", "89"],
                                "AND",
                                [["quantityonhand", "greaterthan", "0"], "OR", ["custitem_ninetydaysales", "greaterthan", "0"]],
                                "AND",
                                ["internalid", "anyof", "386791"]
                            ],
                        columns:
                            [
                                search.createColumn({ name: "internalid", summary: "GROUP", label: "Internal ID" }),
                                search.createColumn({ name: "internalid", join: "CUSTRECORD_RFS_REPLENISHMENT_RULE_ITEM", summary: "MAX", label: "Internal ID" }),
                                search.createColumn({ name: "binnumber", summary: "GROUP", label: "Preferred Bin" }),
                                search.createColumn({ name: "custrecord_classmin", join: "CUSTITEM26", summary: "GROUP", label: "Min" }),
                                search.createColumn({ name: "custrecord192", join: "CUSTITEM26", summary: "GROUP", label: "Max" })
                            ]
                    });
                    if (inventoryItemSearchObj.runPaged().count > 0) {
                        let searchResultCount = inventoryItemSearchObj.runPaged();
                        // Processing more than 4,000 results
                        searchResultCount.pageRanges.forEach(function (pageRange) {
                            let myPage = searchResultCount.fetch({ index: pageRange.index });
                            myPage.data.forEach(function (result) {
                                let singleItemObj = {};
                                singleItemObj.itemInternalId = result.getValue({ name: "internalid", summary: "GROUP", label: "Internal ID" });
                                singleItemObj.binEnhancementInternalId = result.getValue({ name: "internalid", join: "CUSTRECORD_RFS_REPLENISHMENT_RULE_ITEM", summary: "MAX", label: "Internal ID" });
                                singleItemObj.itemBinNumber = result.getValue({ name: "binnumber", summary: "GROUP", label: "Preferred Bin" });
                                singleItemObj.itemClassMin = result.getValue({ name: "custrecord_classmin", join: "CUSTITEM26", label: "Min" });
                                singleItemObj.itemClassMax = result.getValue({ name: "custrecord192", join: "CUSTITEM26", label: "Max" });
                                inventoryItemSearchArray.push(singleItemObj);
                            });
                        });
                    }
                    return inventoryItemSearchArray;
                }
                catch (e) {
                    log.error("Error @ fetchInventoryItems", e);
                    return [];
                }
            },

            /**
             * Function to fetch the bin number from the RF-SMART Item Bin Enhancement record
             * @param {number} binEnhancementRecInternalId - Internalid of the custom record
             * @returns {string} binEnhancementBinNumber - Bin number from the custom record
             */
            fetchItemBinEnhancementNumber(binEnhancementRecInternalId) {
                try {
                    let itemBinEnhancementRecSearchObj = search.create({
                        type: "customrecord_rfs_replenishment_rule",
                        filters:
                            [
                                ["internalid", "anyof", binEnhancementRecInternalId],
                                "AND",
                                ["isinactive", "is", "F"]
                            ],
                        columns:
                            [
                                search.createColumn({ name: "custrecord_rfs_replenishment_rule_bin", label: "Bin Number" })
                            ]
                    });
                    let searchResultCount = itemBinEnhancementRecSearchObj.runPaged().count;
                    log.debug("searchResultCount -BIN", searchResultCount);
                    let binEnhancementBinNumber;
                    if (searchResultCount > 0) {
                        itemBinEnhancementRecSearchObj.run().each(function (result) {
                            binEnhancementBinNumber = result.getText({ name: "custrecord_rfs_replenishment_rule_bin", label: "Bin Number" });
                        });
                        return binEnhancementBinNumber;
                    }
                    else {
                        return null;
                    }
                }
                catch (e) {
                    log.error("Erorr @ fetchItemBinEnhancementNumber", e);
                    return null;
                }
            },

            /**
             * Function to fetch the internalid of the bin number from the RF-SMART Item Bin Enhancement custom record 
             * @param {string} itemBinNumber -Item Bin number
             * @returns {number} binInternalId - Internal id of the Bin Number
             */
            findBinNumberInternalId(itemBinNumber) {
                try {
                    let binSearchObj = search.create({
                        type: "bin",
                        filters:
                            [
                                ["binnumber", "is", itemBinNumber]
                            ],
                        columns:
                            [
                                search.createColumn({ name: "internalid", label: "Internal ID" })
                            ]
                    });
                    let searchResultCount = binSearchObj.runPaged().count;
                    let binInternalId;
                    if (searchResultCount > 0) {
                        binSearchObj.run().each(function (result) {
                            binInternalId = result.getValue({ name: "internalid", label: "Internal ID" });
                        });
                        return binInternalId;
                    }
                    else {
                        return null;
                    }
                }
                catch (e) {
                    log.error("Error @ findBinNumberInternalId", e);
                    return null;
                }
            },

            /**
             * Function to create the custom record RF-SMART Item Bin Enhancement
             * @param {object} inventoryItemObj - object containing details to create the custom record
             */
            createItemBinEnhancementRecord(inventoryItemObj) {
                try {
                    let newItemBinEnhancementRecord = record.create({
                        type: "customrecord_rfs_replenishment_rule",
                        isDynamic: true
                    });
                    newItemBinEnhancementRecord.setValue({ fieldId: "custrecord_rfs_replenishment_rule_item", value: inventoryItemObj.itemInternalId });
                    newItemBinEnhancementRecord.setText({ fieldId: "custrecord_rfs_replenishment_rule_bin", text: inventoryItemObj.itemBinNumber });
                    newItemBinEnhancementRecord.setValue({ fieldId: "custrecord_rfs_binenhance_location", value: 7 });
                    newItemBinEnhancementRecord.setValue({ fieldId: "custrecord_rfs_replenishment_rule_status", value: 1 });
                    newItemBinEnhancementRecord.setValue({ fieldId: "custrecord_rfs_replenishment_rule_min", value: inventoryItemObj.itemClassMin });
                    newItemBinEnhancementRecord.setValue({ fieldId: "custrecord_rfs_replenishment_rule_max", value: inventoryItemObj.itemClassMax });
                    // Save the record
                    let newItemBinEnhancementRecordId = newItemBinEnhancementRecord.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: false
                    });
                    log.debug("record created ", newItemBinEnhancementRecordId)
                    if (MAIN.checkForParameter(newItemBinEnhancementRecordId)) {
                        record.submitFields({
                            type: record.Type.INVENTORY_ITEM,
                            id: inventoryItemObj.itemInternalId,
                            values: { "custitem_jj_rfsmart_item_bin_error": "" }
                        });
                    }
                }
                catch (e) {
                    log.error("Error @ createItemBinEnhancementCustomRecord", e.message);
                    record.submitFields({
                        type: record.Type.INVENTORY_ITEM,
                        id: Number(inventoryItemObj.itemInternalId),
                        values: { custitem_jj_rfsmart_item_bin_error: e.message }
                    });
                }
            },

            /**
             * Function to update the custom record RF-SMART Item Bin Enhancement
             * @param {*} inventoryItemObj - object containing details to update the custom record
             * @param {number} binEnhancementRecInternalId - nternal id of the RF-SMART Item Bin Enhancement record
             */
            updateItembinEnhancementRecord(inventoryItemObj, binEnhancementRecInternalId) {
                try {
                    let itemBinInternalId = MAIN.findBinNumberInternalId(inventoryItemObj.itemBinNumber);
                    log.debug("itemBinInternalId", itemBinInternalId);
                    if (MAIN.checkForParameter(itemBinInternalId)) {
                        let updatedBinRecId = record.submitFields({
                            type: "customrecord_rfs_replenishment_rule",
                            id: Number(binEnhancementRecInternalId),
                            values: {
                                custrecord_rfs_replenishment_rule_bin: itemBinInternalId,
                                custrecord_rfs_binenhance_location: 7,
                                custrecord_rfs_replenishment_rule_status: 1,
                                custrecord_rfs_replenishment_rule_min: inventoryItemObj.itemClassMin,
                                custrecord_rfs_replenishment_rule_max: inventoryItemObj.itemClassMax
                            }
                        });
                        log.debug("updatedBinRecId", updatedBinRecId);
                        if (MAIN.checkForParameter(updatedBinRecId)) {
                            record.submitFields({
                                type: record.Type.INVENTORY_ITEM,
                                id: inventoryItemObj.itemInternalId,
                                values: { "custitem_jj_rfsmart_item_bin_error": "" }
                            });
                        }
                    }
                }
                catch (e) {
                    log.error("Error @ updateItembinEnhancementRecord", e);
                    record.submitFields({
                        type: record.Type.INVENTORY_ITEM,
                        id: inventoryItemObj.itemInternalId,
                        values: { "custitem_jj_rfsmart_item_bin_error": e.message }
                    });
                }
            }
        }

        /**
         * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
         * @param {Object} inputContext
         * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Object} inputContext.ObjectRef - Object that references the input data
         * @typedef {Object} ObjectRef
         * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
         * @property {string} ObjectRef.type - Type of the record instance that contains the input data
         * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
         * @since 2015.2
         */

        const getInputData = (inputContext) => {
            try {
                let inventoryItemSearchArray = MAIN.fetchInventoryItems();
                log.debug("inventoryItemSearchArray", inventoryItemSearchArray);
                return inventoryItemSearchArray;
            }
            catch (e) {
                log.error("Error @ getInputData", e);
            }

        }

        /**
         * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
         * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
         * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
         *     provided automatically based on the results of the map stage.
         * @param {Iterator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
         *     reduce function on the current group
         * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
         * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} reduceContext.key - Key to be processed during the reduce stage
         * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
         *     for processing
         * @since 2015.2
         */
        const reduce = (reduceContext) => {
            try {
                let inventoryItemObj = JSON.parse(reduceContext.values[0]);
                log.debug("inventoryItemObj", inventoryItemObj);
                let binEnhancementRecInternalId = inventoryItemObj.binEnhancementInternalId;
                log.debug("binEnhancementInternalId", binEnhancementInternalId);
                // create RF-SMART item Bin Enhancement custom record
                if (!MAIN.checkForParameter(binEnhancementInternalId)) {
                    log.debug("condition satisfied", "CREATE Custom record");
                    MAIN.createItemBinEnhancementRecord(inventoryItemObj);
                }
                else {
                    let binEnhancementBinNumber = MAIN.fetchItemBinEnhancementNumber(binEnhancementRecInternalId);
                    log.debug("BIN Comparison", "item BIN = " + inventoryItemObj.itemBinNumber + " BIN = " + binEnhancementBinNumber);
                    if (inventoryItemObj.itemBinNumber != binEnhancementBinNumber) {
                        log.debug("Condition Satsfied", "UPDATE Custom record");
                        // Update the RF-SMART item Bin Enhancement custom record
                        MAIN.updateItembinEnhancementRecord(inventoryItemObj, binEnhancementRecInternalId);
                    }
                }
            }
            catch (e) {
                log.error("Error @ reduceContext", e);
            }
        }

        return { getInputData, reduce }
    });
