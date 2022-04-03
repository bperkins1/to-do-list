//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB");

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const thing1 = new Item({
  name: "dishes"
});

const thing2 = new Item({
  name: "laundry"
});

const thing3 = new Item({
  name: "emails"
});

const defaultItems = [thing1, thing2, thing3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);




const items = ["Buy Food", "Cook Food", "Eat Food"];
const workItems = [];

app.get("/", function(req, res) {

  Item.find({}, function (err, results){

    if (results.length === 0) {
      Item.insertMany(defaultItems, function(err){
        if (err) {
          console.log(err);
        } else {
          console.log("succesfully saved default items to DB");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: results});
    }

  });
});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if (!err){
      if (!foundList){
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newEntry = new Item ({
    name: itemName
  });

  if (listName === "Today"){
    newEntry.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function (err, results){
      results.items.push(newEntry);
      results.save();
      res.redirect("/" + listName);
    });
  }

});

app.post("/delete", function(req, res){
  const removedItemId = req.body.checkbox;
  const listName = req.body.listName;
  console.log(listName + "1");

  if (listName === "Today") {
    Item.findByIdAndRemove(removedItemId, function(err){
      if (!err) {
        console.log("deleted item successfully");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: removedItemId}}}, function(err, foundlist){
      if (!err) {
        res.redirect("/" + listName);
      }
    })
  }

});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
