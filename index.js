
const pMap = require("p-map");
const Trello = require("node-trello");
const { key, token } = require("./cred-trello");

const t = new Trello(key, token);

function trelloGetProfile(params){
	return new Promise(function(resolve, reject){
		t.get("/1/members/me", function(err, data) {
			if (err) throw err;
			console.log(data);
		});
	});
}

function trelloGetBoards(boardName){
	return new Promise(function(resolve, reject){
		t.get("/1/members/me/boards", function(err, data) {
			if (err) throw err;
			
			for (i in data) {
				console.log(
					data[i].id,
					"\t",
					data[i].name,
				);
			}
		});
	});
}

function trelloGetBoardLists(boardId){
	return new Promise(function(resolve, reject){
		// let boardId = "5a1b5b63e91eabe3455d36bc";
		t.get("/1/boards/" + boardId + "/lists", function(err, data) {
			if (err) throw err;
			// console.log(data);
			var lists = [];
			for (i in data) {
				// console.log(
				// 	data[i].id,
				// 	"\t",
				// 	data[i].name,
				// );
				lists.push([
					data[i].id,
					data[i].name,
				]);
			}
			resolve(lists);
		});
	});
}

function trelloGetListCards(listId){
	return new Promise(function(resolve, reject){
		// let listId = "5c4144e1083a4b618514b2ce";
		t.get("/1/lists/" + listId + "/cards", function(err, data) {
			if (err) throw err;
			// console.log(data);
			resolve(data);
		});
	});
}

function trelloGetCardChecklistAsText(cardId) {
	return new Promise((resolve, reject) => {
		t.get("/1/cards/" + cardId + '/checklists', function(err, data) {
			if (err) throw err;
			// console.log(data);
			
			let checklistText = "";

			for (i in data) {
				checklistText += "\n* " + data[i].name;

				for (j in data[i].checkItems) {
					checklistText += "\n** " + data[i].checkItems[j].name + 
						(data[i].checkItems[j].state == 'incomplete' ? "" : " [DONE]");
				}
			}

			resolve(checklistText);
		});
	});
}

async function trelloGetCardAttachmentsAsText(cardId) {
	return new Promise((resolve, reject) => {
		t.get("/1/cards/" + cardId + '/attachments', function(err, data) {
			if (err) throw err;
			// console.log(data);
			
			let attachmentsText = "";

			for (i in data) {
				attachmentsText += "\n- [" + data[i].name + "|" + data[i].url + "]";
			}

			resolve(attachmentsText);
		});
	});
}

async function trelloGetCardCommentsAsText(cardId) {
	return new Promise((resolve, reject) => {
		t.get("/1/cards/" + cardId + '/actions', function(err, data) {
			if (err) throw err;
			// console.log(data);

			let commentsText = "";

			for (i in data) {
				if (data[i].type == 'commentCard') {
					commentsText += "\n\n[" + data[i].date + 
						"] @" + data[i].memberCreator.username + 
						" {quote} " + data[i].data.text + " {quote}"
				}
			}
			resolve(commentsText);
		});
	});
}

async function trelloGetCardDetailsFromCardObjectAsDescription(card, list) {
	let desc = card.desc;

	if (card.name.length > 255) {
		desc = "*Long Title:* " + card.name + "\n\n" + desc;
	}

	if (card.badges.checkItems > 0) {
		desc += "\n\n*Checklists:* ";
		desc += await trelloGetCardChecklistAsText(card.id);
	}
	
	if (card.badges.attachments > 0) {
		desc += "\n\n*Attachments:* ";
		desc += await trelloGetCardAttachmentsAsText(card.id);
	}

	desc += "\n\n-------------------\n\n[Trello Card Link|" + card.shortUrl + "]";
	desc += "  -  *List*: " + list[1];

	if (card.labels.length > 0) {
		desc += "  -  *Labels:* " + card.labels[0].name;
	}
	
	if (card.badges.comments > 0) {
		desc += "\n\n-------------------\nh2. Comments ";
		desc += await trelloGetCardCommentsAsText(card.id);
	}

	return desc;
}


// trelloGetBoardLists("hICZUBL0").then((lists) => { lists.map((list) => { console.log(list[0] + "\t\t" + list[1]); }) });

/*

Board: Start Sure (hICZUBL0)

5bf2379c24d7ac376da7a6fb		⚠️ BLOCKED / URGENT
5c482b2d015e254feb077115		Waiting for CNA Investigation
5c3e2c4d44d1b665dc30c81b		📫 Backlog / INBOX
5bd99db79a022335b7adce31		⏳In Progress
5bbb2ef6ad8e1d3fd4218195		🔬 Review (QA Ready)
5bae78ba73103338b3f7279f		✅ DONE
5c3e5cd8ff7c22559ff0fcb1		Deployment / Go live Todos
5c3383fe11a8215654a59cee		Not Required for Launch
5b7ab242f3b5e053f3761eac		📝 REFERENCES
*/

trelloGetListCards('5bae78ba73103338b3f7279f')
	.then((cards) => {
		cards.map((card) => {
			console.log(
				card.shortUrl, '\t', 
				new Date(1000 * parseInt(card.id.substring(0,8), 16)), '\t',
				card.dateLastActivity, '\t', 
				card.name);
		});
	});