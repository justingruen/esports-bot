// require the discord.js module
const Discord = require('discord.js');
// require your app's token
const { prefix, token} = require('./config.json');

// create a new Discord client
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION']});

//Json list of reactions to keep track of guilds and their reacts
var reactionList = { }

// when the client is ready, run this code
// this event will only trigger one time after logging in
client.once('ready', () => {
    console.log('Ready!');
});


//Note: Honestly, I have no clue how async/await works, but the code I got one of the lines from had it so I'm just using it

//what to do if they change the channelid... will that change anything?  --> should work, needs more extensive testing

//Also note, if I'd like to keep the list even when it resets, every time i update it I could export it
//to a seperate file, and in the client.once('ready') I could import it


//listroles and listusers [emoji]

function checkGuilds(guildName) {       //checks if guild is empty in reactionList. If so, delete (bc its empty, obv)
    if (reactionList[guildName][0] === undefined) delete reactionList[guildName]
}

client.on('message', async message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    // const args = message.content.slice(prefix.length).trim().split(/ +/);
    // const command = args.shift().toLowerCase();


    var command = message.content.substr(1).split(' ')[0];
    const args = message.content.slice(command.length+2).split(', ');
    console.log('===================')
    console.log(command)
    console.log(args)
    console.log('===================')    
    
    //Make it so once its reacted with a green check, the messages will delete... how will that effect everything else? Maybe just leave it.
    if (command === 'help') {
        if (message.member.roles.cache.some(role => role.name === 'Administrator')) {
            message.channel.send("Notes: Only users with the Administrator role can use these commands. Does not work with custom emojis. Delete a bot message for the emojis to be available again. ")
            message.channel.send("Also for convenience, all messages not-addemoji related are deleted in 10 secs.")
            message.channel.send("Please use !helpcommands for the command list, and use !setchannel to get started.")
        } else {
            message.channel.send('Only Administrator role can call commands!').then(msg => { msg.delete({ timeout: 10000 })});
        }
        return
    }

    if (command === 'helpcommands') {
        if (message.member.roles.cache.some(role => role.name === 'Administrator')) {
            message.channel.send("\n!setchannel \n     Set the channel used for the role reactions!.\n");
            message.channel.send("\n!addemoji [game1], [reaction1 (ie. :turkey:)], [role1] etc \n     Creates a message with reactions members can click on to give themselves a role. Please make sure the emoji is correct!\n");
            message.channel.send("\n!listemojis \n     List emojis currently in use, and their game and role.\n");
        }
        return
    }


    //Gonna need to redo this, don't forget for if its empty
    if (command === 'listemojis') {     //eventually change it to list all role/react/game combos?
        if(!reactionList.hasOwnProperty(message.guild.name)) {
            message.channel.send("There aren't any emojis yet!").then(msg => { msg.delete({ timeout: 10000 })}) 
            return
        }

        if (message.member.roles.cache.some(role => role.name === 'Administrator')) {
            var emojiList = ''
            for(var key in reactionList) {
                if(key != 'channelid') {
                    emojiList += `\n${key}     ${reactions_games[key]}     ${reactions_roles[key]}`
                }
            }
            emojiList = '' 
            ? message.channel.send(emojiList).then(msg => { msg.delete({ timeout: 20000 })}) 
            : message.channel.send("There aren't any emojis yet!").then(msg => { msg.delete({ timeout: 10000 })}) 

        }
        return
    }

    if (command === 'setchannel') { //setchannel            //Eventually make for multiple channels? eh
        reactionList[message.guild.name] = { "channelid": `${message.channel.id}` }

        for (var key in reactionList) {     // test this first
            if(key != 'channelid') {
                delete reactionList[message.guild.name][key]
            }
        }
        message.channel.send(`Channel ${message.channel.name} set!`).then(msg => { msg.delete({ timeout: 10000 })}) 
        message.delete({ timeout: 10000 })
        return
    }

    if (command === 'addemoji') {   //addemoji game1, reaction1, role1 etc
        if(reactionList[message.guild.name] === undefined) {
            message.channel.send('Please use !setchannel first to set a channel!').then(msg => { msg.delete({ timeout: 10000 })}) 
            message.delete({ timeout: 10000 })
            return
        }

        if (args.length < 3 || (args.length % 3) != 0 ) {
            message.delete({ timeout: 10000 })
            message.channel.send(`You didn't provide enough arguments, ${message.author}!`).then(msg => { msg.delete({ timeout: 10000 })});
            return
        } else if (message.member.roles.cache.some(role => role.name === 'Administrator')){

            
            //Make sure roles exist... also, length-1? -2? is it right? Also check if game has ' React ' in it. If it does, messes up the delete
            for (i = 2; i < args.length; i+=3) {
                if (message.guild.roles.cache.find(r => r.name === args[i]) === undefined) {
                    message.channel.send(`Role ${args[i]} does not exist. Please recheck the spelling and try again.`).then(msg => { msg.delete({ timeout: 10000 })})
                    // delete original message
                    message.delete({ timeout: 10000 })
                    // checkGuilds(message.guild.name)
                    return
                }
                if (args[i-2].includes(' React ')) {
                    message.channel.send(`If you're seeing this message, one of the games has " React " in it. It was unlikely, but, here we are. Sorry. Please call the game something else`).then(msg => { msg.delete({ timeout: 10000 })})
                    // delete original message
                    message.delete({ timeout: 10000 })
                    // checkGuilds(message.guild.name)
                    return
                }
            }

            //Make sure emoji exists
            //idk how, so... just hope it exists
            
            //Make sure emoji isnt already in dic
            for (i = 1; i < args.length; i+=3) {
                if (!reactionList[message.guild.name].hasOwnProperty(args[i])) {
                    reactionList[message.guild.name][args[i]] = {
                        'role': `${args[i+1]}`,
                        'game': `${args[i-1]}`
                    }
                } else {
                    message.channel.send(`Reaction ${args[i]} already exists!`).then(msg => { msg.delete({ timeout: 10000 })})
                }
            }

            
            var description = `React to this message to get your roles!\n `

            //length-1? -2? I dont think it matters
            for (i = 0; i < args.length-1; i+=3) {
                description += `React ${args[i+1]} to get ${args[i]} as a role.\n `;
            }

            let embed = new Discord.MessageEmbed()
            .setDescription(description)
            .setColor('BLUE')
            let msgEmbed = await client.channels.cache.get(reactionList[message.guild.name]['channelid']).send(embed)
            for(i = 0; i < args.length-1; i+=3){
                msgEmbed.react(args[i+1])
            }

            // delete original message
            message.delete({ timeout: 10000 })
            
        }
    }
});


client.on('messageReactionAdd', async (reaction, user) => {
    if(!reactionList.hasOwnProperty(reaction.message.guild.name)) return

    if (reaction.message.channel.id === reactionList[reaction.message.guild.name]['channelid']) {
        if(reaction.message.partial) await reaction.message.fetch();
        if(reaction.partial) await reaction.fetch();

        if (user.bot) return
        if (!reaction.message.guild) return

        //the first if (the channelid one) was originally here
        if (reaction.message.authorid === client.user.id) {
            try {
                await reaction.message.guild.members.cache.get(user.id).roles.add(reaction.message.guild.roles.cache.find(r => r.name === reactionList[reaction.message.guild.name][reaction.emoji.name]['role']))
            } catch (error) {
                reaction.message.channel.send("@Administrator, The block trying to be used is broken. Please recreate the !addemoji block.")
            }
        }
    }
})

client.on('messageReactionRemove', async (reaction, user) => {
    if(!reactionList.hasOwnProperty(reaction.message.guild.name)) return

    if (reaction.message.channel.id === reactionList[reaction.message.guild.name]['channelid']) {
        if(reaction.message.partial) await reaction.message.fetch();
        if(reaction.partial) await reaction.fetch();

        if (user.bot) return
        if (!reaction.message.guild) return

        //the first if (the channelid one) was originally here
        if (reaction.message.author.id === client.user.id) {
            try {   //I think .catch works too, but dont fix it if it aint broke
                await reaction.message.guild.members.cache.get(user.id).roles.remove(reaction.message.guild.roles.cache.find(r => r.name === reactionList[reaction.message.guild.name][reaction.emoji.name]['role']))
            } catch (error) {
                reaction.message.channel.send("@Administrator, The block trying to be used is broken. Please recreate the !addemoji block.")
            }
        }
    }
})

client.on('messageDelete', function(message) {
    if(!reactionList.hasOwnProperty(message.guild.name)) return

    //MAKE SURE TO Check, if the guild then has no reaction entries, delete the guild from reactionList

    // search message for the reactions
    if (message.content === 'Updated! The emojis are now available again for use!') return

    if (message.channel.id === reactionList[message.guild.name]['channelid']) {
        if (message.embeds.length === 0) return
        if (message.author.id === client.user.id) {
            for (let embed of message.embeds) {
                for (i = 0; i < embed.description.split(' ').length; i++) {
                    if (embed.description.split(' ')[i] === 'React') {
                        //CHECK WHETHER ITS IN REACTIONLIST FIRST incase its from a previous bot reset. can't hurt. or if too lazy just do try...catch i guess. idek
                        delete reactionList[message.guild.name][embed.description.split(' ')[i+1].emoji.name]
                    }
                }                
            }

            //Edit so it gives all emojis
            message.channel.send('Updated! The emojis are now available again for use!').then(msg => { msg.delete({ timeout: 10000 })});
        }
    }
})

client.login(token);

// !addemoji game2, :poop:, rocket league