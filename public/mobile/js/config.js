
var datasources = new Array("http://smarthl.itm.uni-luebeck.de/ssp/be-0001/Luebeck",
    "http://smarthl.itm.uni-luebeck.de/ssp/be-0002/Santander",
    "http://smarthl.itm.uni-luebeck.de/ssp/be-0002/SantanderParkingSpaces");

var cities = [];

var citiesarray = [];


var city = {};
city.name = "Lübeck";
city.geo = {};
city.geo.lat = 53.867814;
city.geo.lng = 10.687208;
citiesarray.push(city);

city = {};
city.name = "Travemünde";
city.geo = {};
city.geo.lat = 53.962246;
city.geo.lng = 10.870457;
citiesarray.push(city);
cities.push(citiesarray)


citiesarray = [];
city = {};
city.name = "Santander";
city.geo = {};
city.geo.lat = 43.46075;
city.geo.lng = -3.80811;
citiesarray.push(city);
cities.push(citiesarray);

cities.push([]);


