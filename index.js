'use strict';

const Discord = require('discord.js');
const { token, prefix, roleWeights } = require('./config.json');

const client = new Discord.Client();

client.once('ready', () => {
  console.log('Ready!');
});

function help(channel) {
  const embed = new Discord.MessageEmbed()
    .setTitle("RaffleBot Command Help")
    .setColor(0x703893)
    .setDescription(
      "Prefix: " + prefix + "\n\n" +
      "__Commands:__\n" +
      "help:\tprints this embed\n" +
      // "eval:\tvalidates server roles and weights\n" +
      "count:\tcounts user roles and assigns tickets\n" +
      "draw <#>:\tdraws and removes a # of tickets (number optional, defaults to 1)\n" +
      "clear:\tclears assigned tickets\n" +
      "list:\tprints currently assigned tickets"
    );
  channel.send(embed);
}

function evalRoles(guild, channel) {
  let valid = true;
  const embed = new Discord.MessageEmbed()
    .setTitle('Role Evaluation');

  let responseBody = "";
  let guildRoles = guild.roles.cache;
  for (let roleID in roleWeights) {
    let role = guildRoles.find(role => role.id === roleID);
    if (!role) {
      responseBody += "No role with ID: " + roleID + " exists!\n";
      valid = false;
    } else {
      responseBody += "Found role with ID: **" + roleID + "** named: \"**" + role.name + "**\" and with ticket weight: **" + roleWeights[roleID] + "**\n";
    }
  }
  if (!valid) responseBody += "\n*Fix role IDs before proceeding.*";
  embed.setDescription(responseBody);

  embed.setColor(valid ? 0x008000 : 0xFF0000); // green for good, red for bad
  channel.send(embed);
  return valid;
}

var ticketList = {};
function countUsers(guild, channel) {
  if (evalRoles(guild, channel)) {
    let tickets = {};
    let guildRoles = guild.roles.cache;
    for (let roleID in roleWeights) {
      let role = guildRoles.find(role => role.id === roleID);
      for (let member of role.members) {
        !tickets[member[0]] ? tickets[member[0]] = roleWeights[roleID] : tickets[member[0]] += roleWeights[roleID];
      }
    }
    ticketList[guild.id] = tickets;
    listTickets(guild, channel);
  }
}

function drawTicket(guild, channel, arg) {
  let number = parseInt(arg);
  if (!Number.isInteger(number)) number = 1;
  const embed = new Discord.MessageEmbed()
  if (number > 3) {
    embed.setTitle("Woooaaah . . .")
      .setColor(0xFF0000)
      .setDescription("Please limit your draw requests to 3 at a time.");
    channel.send(embed);
    return;
  }
  do {
    embed.setTitle("Drawing a Ticket . . .");
    if (ticketList[guild.id]) {
      let embedBody = "";
      let drawList = [];
      for (let participant in ticketList[guild.id]) {
        for (let i = ticketList[guild.id][participant]; i > 0; i--) {
          drawList.push(participant);
        }
      }
      let winner = drawList[Math.floor(Math.random() * drawList.length)];
      // remove winner('s ticket from array somehow
      embed.setColor(0x008000)
        .setDescription("And the winner is . . . <@" + winner + ">!");
    } else {
      embed.setColor(0xFF0000)
        .setDescription("No more tickets have been assigned!");
      return;
    }
    channel.send(embed);
    number--;
  } while (number > 0);
}

function clearTickets(guild, channel) {
  const embed = new Discord.MessageEmbed()
    .setTitle("Clearing Tickets . . .");
  if (ticketList[guild.id]) {
    delete ticketList[guild.id];
    embed.setColor(0x008000)
      .setDescription("Tickets cleared!");
  } else {
    embed.setColor(0xFF0000)
      .setDescription("No tickets have been assigned!");
  }
  channel.send(embed);
}

function listTickets(guild, channel) {
  const embed = new Discord.MessageEmbed()
    .setTitle("Assigned Tickets");
  if (ticketList[guild.id]) {
    let embedBody = "";
    let members = guild.members.cache;
    for (let participant in ticketList[guild.id]) {
      embedBody += members.find(member => member.id === participant).user.toString() + ": " + ticketList[guild.id][participant] + "\n";
    }
    embed.setColor(0x008000)
      .setDescription(embedBody);
  } else {
    embed.setColor(0xFF0000)
      .setDescription("No tickets have been assigned!");
  }
  channel.send(embed);
}

function notACommand(channel) {
  channel.send("Not a valid command! Use \"" + prefix + " help\" for help.");
}

client.on('message', message => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // console.log(message.content);
  // console.log(command, args);

  switch (command) {
    case "help":
      help(message.channel);
      break;
    case "eval":
      evalRoles(message.guild, message.channel);
      break;
    case "count":
      countUsers(message.guild, message.channel);
      break;
    case "draw":
      drawTicket(message.guild, message.channel, args[0]);
      break;
    case "clear":
      clearTickets(message.guild, message.channel);
      break;
    case "list":
      listTickets(message.guild, message.channel);
      break;
    default:
      notACommand(message.channel);
  }

});

client.login(token);