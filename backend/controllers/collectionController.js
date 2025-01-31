const Collection = require("../models/collection.model");
const chartList = require("../models/chartlist.model");
const algorithm = require("../algorithm/algorithm");

const collectionController = {
    //[GET] /collection/:id
    // need modify to response the update data
    async getCollectionDetails(req, res) {
        try {
            await Collection.findOne({ _id: req.params.id })
                .then(function (collection) {
                    res.status(200).json(collection);
                })
                .catch(function (err) {
                    console.log(err);
                    res.json({ msg: "can not find the collection" });
                });
        } catch (e) {
            console.log(e);
        }
    },

    //[POST] /collection/add
    // auto 10 values
    async addNewCollection(req, res) {
        try {
            const values = req.body.values.split(",").map(function (value) {
                return parseInt(value, 10);
            });
            const categories = req.body.categories.split(",");
            const collectionValues = [];
            if (categories.length === values.length) {
                for (let i = 0; i < values.length; i++) {
                    let newValues = { category: categories[i], value: values[i] };
                    collectionValues.push(newValues);
                }
            }
            console.log(collectionValues);
            const newCollection = await new Collection({
                name: req.body.name,
                values: collectionValues,
            });
            newCollection.save();
            const userId = req.body.userId;
            const userChartList = await chartList.findOne({ userId: userId });
            if (userChartList) {
                await chartList
                    .findOne({ userId: userId })
                    .then(function (lists) {
                        lists.DataList.push(newCollection._id);
                        lists.save();
                        console.log(lists);
                    })
                    .catch(function (err) {
                        console.log(err);
                    });
                res.json({
                    success: true,
                    message: "add new successfully",
                    chartId: newCollection._id,
                });
            } else {
                const newChartList = new chartList({
                    userId: userId,
                    DataList: [],
                });
                newChartList.DataList.push(newCollection._id);
                newChartList.save();
                res.json({
                    success: true,
                    message: "add and create new successfully",
                    chartId: newCollection._id,
                });
            }
        } catch (e) {
            console.log(e);
        }
    },

    //[GET] collection/groupData/:id

    // using hashTable to group the same data
    async groupingData(req, res) {
        try {
            await Collection.findOne({ _id: req.params.id })
                .then(function (collection) {
                    let median = algorithm.findMedian(collection.values);
                    console.log(median);
                    let colletcionBelowValues = algorithm.groupBelowData(
                        collection.values,
                        median
                    );
                    let collectionAboveValues = algorithm.groupAboveData(
                        collection.values,
                        median
                    );
                    let belowCollection = {
                        colletcionBelowValues: colletcionBelowValues,
                    };
                    let aboveCollection = {
                        collectionAboveValues: collectionAboveValues,
                    };
                    res.json({
                        colletcionBelowValues: belowCollection,
                        collectionAboveValues: aboveCollection,
                        collection: collection,
                        median: median,
                    });
                })
                .catch(function (err) {
                    console.log(err);
                    res.json({ msg: "can not find the collection" });
                });
        } catch (e) {
            console.log(e);
        }
    },

    // [Patch]   /collection/edit/:id
    async editCollection(req, res) {
        try {
            console.log(req.body);
            console.log(req.body.categories);
            let collectionValues = [];
            let values = req.body.values.split(",").map(function (value) {
                return parseInt(value, 10);
            });
            let categories = req.body.categories.split(",");
            for (let i = 0; i < values.length; i++) {
                collectionValues.push({ category: categories[i], value: values[i] });
            }
            console.log(collectionValues);
            await Collection.findOneAndUpdate(
                { _id: req.params.id },
                { values: collectionValues, name: req.body.name }
            )
                .then(function (collection) {
                    console.log(collection);
                    res.json({ collection });
                })
                .catch(function (err) {
                    console.log(err);
                });
        } catch (e) {
            console.log(e);
        }
    },

    // [Post] /collection/searchValues/:id

    // find value by using BST and binary search to get position
    async searchValues(req, res) {
        try {
            await Collection.findOne({ _id: req.params.id })
                .then(function (collection) {
                    let array = [];
                    for (const arrayElement of collection.values) {
                        array.push(arrayElement.value);
                    }
                    let result = algorithm.findValue(array, req.body.value);
                    let finalResult;
                    if (result) {
                        for (const collectiontElement of collection.values) {
                            if (collectiontElement.value === result.node.data) {
                                finalResult = collectiontElement;
                            }
                        }
                    }
                    let position = algorithm.findPosition(
                        collection.values,
                        result.node.data
                    );
                    position.index = array.length - position.index;
                    res.json({ finalResult, position });
                })
                .catch(function (err) {
                    console.log(err);
                });
        } catch (e) {
            console.log(e);
        }
    },
    //[GET] collection/statistic/:id
    async statistic(req, res) {
        try {
            await Collection.findById(req.params.id)
                .then(function (collection) {
                    console.log(collection);
                    const max = algorithm.findMax(collection.values);
                    const min = algorithm.findMin(collection.values);
                    const median = algorithm.findMedian(collection.values);
                    console.log(median);
                    const standardDeviation = algorithm.standardDeviation(
                        collection.values
                    );
                    console.log(standardDeviation)
                    let maxElement;
                    let minElement;
                    for (const element of collection.values) {
                        if (element.value === max) {
                            maxElement = element;
                        } else if (element.value === min) {
                            minElement = element;
                        }
                    }
                    res
                        .status(200)
                        .json({ maxElement, minElement, median, standardDeviation });
                })
                .catch(function (err) {
                    console.log(err);
                    res.status(404).json({ error: err });
                });
        } catch (e) {
            console.log(e);
        }
    },
    // [DELETE] collection/delete/:userId/:id
    async deleteCollection(req, res) {
        try {
            console.log(req.params.userId);
            console.log(req.params.id);
            await Collection.findOneAndDelete({ _id: req.params.id })
                .then(async (result) => {
                    await chartList
                        .findOne({ userId: req.params.userId })
                        .then(async (chartList) => {
                            console.log(chartList.DataList);
                            let newDataList = chartList.DataList.filter((item) => {
                                return !item._id.toString().includes(req.params.id);
                            });
                            chartList.DataList = newDataList;
                            chartList.save();
                            res.status(200).json({ status: "success" });
                        });
                })
                .catch((err) => {
                    console.log(err);
                });
        } catch (e) {
            console.log(e);
        }
    },
    //[GET] collection/sort/:id
    async sortCollection(req, res) {
        try {
            await Collection.findById(req.params.id)
                .then((collection) => {
                    const newArray = collection.values;
                    let arrayDesc = newArray.sort((a, b) => {
                        return b.value - a.value;
                    });
                    let arrayAsc = newArray.slice().sort((a, b) => {
                        return a.value - b.value;
                    });
                    res
                        .status(200)
                        .send({
                            collectionName: collection.name,
                            sortedCollection: arrayAsc,
                            sortedCollectionDesc: arrayDesc,
                        });
                })
                .catch(function (e) {
                    console.log(e);
                });
        } catch (e) {
            console.log(e);
        }
    },
};
module.exports = collectionController;
