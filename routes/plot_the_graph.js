var express = require('express');
var router = express.Router();
var fs = require('fs');
var mongoose = require('mongoose');
var schema = require('./org_data_schema');
var obj={};
var json = [];

router.post('/',function(req,res,next){                                   //router for the code
    mongoose.connect('mongodb://localhost/someOtherDbName');
    obj={};
    json = [];
    //console.log(schema);
    var filter = [];        //filter data available in this variable will be added to the Ui for selection
    var commitData = mongoose.model('someOtherCollectionName',schema,'someOtherCollectionName');
   //var data = req.body.str;
   var data = req.body.data;
     console.log(data);

     console.log(data["y_axis_dim"]);
// var repo_filter_data = {"repo":{$in:["node"]}};
// var user_filter_data = {"committer.name":{$in:["abhinavtdgp","Arul",'unknown']}};

//var filter_data = json_param["filter"]=="repo"?repo_filter_data:user_filter_data;
var limit_data = data["type"].split(" ");
var sorting_side = (limit_data[0]=="top")?-1:1;
var limit = limit_data[1];
console.log(limit);
var group_data = "$" + data["x_axis_dim"];
var sum_data = "$" + data["y_axis_dim"];
console.log(group_data);
var obj = (data["y_axis_dim"]=="noOfCommits")?{ "$sum": 1}:{ "$sum": sum_data};
console.log(obj);
if(data["x_axis_dim"]=="time")
{
    var to_year = data["to_year"];
    var to_month =data["to_month"];
    var to_date = data["to_date"];
    var from_date =data["from_date"];
    var from_year = data['from_year'];
    var from_month = data["from_month"];
    var group_data_time = {'month' : "$commitMonth",'year':"$commitYear"};
    console.log("we got the time request");
    var grouping_data =[
                      {
                        "$match":
                        {
                    "$and": [
                            {"commitDate" : {'$gte': from_date}},
                            {"commitDate":{'$lte': to_date}}
                            // {"commitYear":{'$lte': to_year}},
                            // {"commitMonth":{'$gte': from_month}},
                            // {"commitMonth":{'$lte': to_month}}
                            //{"commitMonth": {"$and":[{"$lt": to_month},{"$gt": from_month}]}}
                         ]
                        }
                      },
                      { "$group": {
                          "_id": {month : "$commitMonth",year:"$commitYear"},
                          //"repo": group_data,
                          // "year": "$commitYear",
                          // "month" :"$commitMonth",

                          "recommendCount": obj
                      }},
                      // Sorting pipeline
                      //{ "$sort": { "recommendCount": sorting_side } },
                      // Optionally limit results
                      //{ "$limit": parseInt(limit) }
              ]
}
else{
  var grouping_data = [
                    { "$group": {
                        "_id": group_data,
                        //"repo": group_data,
                        "recommendCount": obj
                    }},
                    // Sorting pipeline
                    { "$sort": { "recommendCount": sorting_side } },
                    // Optionally limit results
                    { "$limit": parseInt(limit) }
            ]
}
// data for plotting depending upon the json selected
commitData.aggregate(grouping_data, function (err, result) {
                      if (err) {
                          console.log(err);
                          return;
                      }
                      mongoose.connection.close();
                      //console.log(JSON.stringify(result));

                      if(data["x_axis_dim"]=="time")
                      covertobjtodate(result,0);
                      else {
                        json = result;
                      }
                      console.log(json);

                      res.send(json);
                      //fetch_the_data(result,0)
    });


// res.send("Got the Data");
});

function covertobjtodate(result,i){
  //console.log(result);
  //for(var i=0;i<result.length;i++){
    obj={};
    var date = new Date();
    date.setMonth(result[i]["_id"]["month"]);
    date.setYear(result[i]["_id"]["year"]);
    console.log(date);
    obj["_id"]=date;
    obj["recommendCount"] = result[i]["recommendCount"];

  //}
  if(i<result.length-1){
    i++;
    json.push(obj);
    covertobjtodate(result,i);
  }
  else{
        json.push(obj);
        console.log(json);
        return;
      }

}
module.exports = router
