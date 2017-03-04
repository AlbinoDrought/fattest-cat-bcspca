#!/usr/bin/env node

const request = require("request-promise");
const opener = require("opener");
const Promise = require("bluebird");
const {compact} = require("lodash");
const colors = require("colors");

const BCSPCA_BASE = "http://adopt.spca.bc.ca";
const ADOPTION_API = `${BCSPCA_BASE}/get.php?get=animal&cat=cats`;
const VIEW_URL = `${BCSPCA_BASE}?profile_id=`;

const fetchCats = Promise.method(() => {
	return request({
		uri: ADOPTION_API,
		json: true,
	})
	.then((cats) => {
		return cats;
	})
	.catch((err) => {
		console.log("Error fetching cats:", err);
		return [];
	});
});

console.log("Accessing BC SPCA (Cat Department)...");

colors.setTheme({
	output: ["yellow", "bold"],
});

fetchCats()
	.tap((cats) => console.log(`Cat information system accessed. ${cats.length} cats found. Beginning weighing process...`))
	.map((cat) => {
		if(!cat.UnitWeight || cat.UnitWeight != "kg" || !cat.TotalWeight) return {};
		
		const name = cat.Name;
		const weight = parseFloat(cat.TotalWeight.replace(cat.UnitWeight, "").trim());
		const isFemale = cat.Sex == "Female";
		const id = cat.ShelterBuddyID;
		const url = VIEW_URL + id;
		
		console.log("Weighing cat: %s", colors.green(name));
		
		return { name, weight, isFemale, url };
	})
	.then(compact)
	.then((cats) => {
		let fattestCat = { weight: 0 };
		
		cats.forEach((cat) => {
			if(cat.weight > fattestCat.weight) {
				fattestCat = cat;
			}
		});
		
		console.log(`The fattest cat is ${colors.green.underline(fattestCat.name)}. ${(fattestCat.isFemale ? "She" : "He")} weighs ${fattestCat.weight} kgs.`);
		
		setTimeout(() => console.log("Opening cat profile..."), 2000);
		setTimeout(() => opener(fattestCat.url), 4000);
	});