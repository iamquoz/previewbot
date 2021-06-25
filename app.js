const dotenv = require('dotenv');
dotenv.config();

const spotifapi = require('spotify-web-api-node')
var spotify = new spotifapi();
spotify.setAccessToken(process.env.spotify);

const Discord = require('discord.js');
const client = new Discord.Client();
prefix = '!preview';

const fs = require('fs');
const https = require('https');

client.on('message', message => {
	if (!message.content.startsWith(prefix) || message.author.bot)
		return;

	const args = message.content.slice(prefix.length).trim().split(/ +/);
	
	if (!args.length) {
		message.channel.send(`Send ${prefix} "Artist name" | "Song name" to get a preview of a song`)	 
		return;
	}

	if (!args.includes('|')) {
		message.channel.send(`Specify the song name`)
		return;
	}

	var artistname = '';
	var songname = '';
	var reachedSep = false;

	for (let i = 0; i < args.length; i++) {
		if (args[i] === '|')
			reachedSep = true;
		else if (!reachedSep)
			artistname += args[i] + ' ';
		else
			songname += args[i] + ' ';
	}
	
	artistname = artistname.slice(0, -1).toLowerCase();
	songname = songname.slice(0, -1).toLowerCase();

	spotify.searchTracks(`track: ${songname} artist: ${artistname}`)
		.then(function (data) {
			if (data.body.tracks.items.length === 0)
				message.channel.send(`Song not found!`)
			else {
				const filename = `Preview - ${data.body.tracks.items[0].artists.map(artist => artist.name).join('& ')} - ${data.body.tracks.items[0].name}.mp3`;
				const file = fs.createWriteStream(filename);
					const request = https.get(`${data.body.tracks.items[0].preview_url}.mp3`, 
						function (responce) {
						responce.pipe(file);
						file.on('finish', function () {
							file.close();
							message.channel.send(new Discord.MessageAttachment(`./${filename}`))
							.then(() => {
								fs.unlinkSync(`./${filename}`);
							})
						})
					})
			}
		}, function(error) {
			console.log(error);
			message.channel.send(`An error occured!`);
		});

});

client.login(process.env.discord);