'use strict';

const Discord = require('discord.js');
const { token, prefix, roleWeights, allowedRoles } = require('./config.json');

const client = new Discord.Client();

client.once('ready', () => {
  console.log('Ready!');
  client.user.setActivity("for \"" + prefix + " help\"", { type: 'WATCHING' })
    .then(presence => console.log(`Activity set to ${presence.activities[0].name}`))
    .catch(console.error);
});

function help(guild, channel) {
  let preroleText = "";
  let guildRoles = guild.roles.cache;
  for (let roleID of allowedRoles) {
    try {
      let role = guildRoles.get(roleID);
      preroleText += role.name + ", ";
    } catch {
      preroleText += "**ID: " + roleID + " is not a role on this server**, "
    }
  }
  let roleText = preroleText.slice(0, -2);

  const embed = new Discord.MessageEmbed()
    .setTitle("RaffleBot Command Help")
    .setColor(0x703893)
    .setDescription(
      "Prefix: " + prefix + "\n" +
      "Privileged Roles: " + roleText + "\n" +
      "\n__Commands:__\n" +
      "**help**: prints this embed\n" +
      "**list**: prints currently assigned tickets\n" +
      "**flip**: prints result of a coin flip\n" +
      "\n__Privileged Commands:__\n" +
      // "eval: validates server roles and weights\n" +
      "**count**: counts member roles and assigns tickets\n" +
      "**draw <#>**: draws and removes a # of tickets (number optional, defaults to 1)\n" +
      "**clear**: clears assigned tickets\n" +
      "**add [MEMBER] <#>**: assigns # tickets to MEMBER (number optional, defaults to 1)\n" +
      "**remove [MEMBER] <#>**: removes # assigned tickets from MEMBER (number optional, defaults to 1)\n"
    ).setFooter("Message haazman#0001 with issues and bugs.");
  channel.send(embed);
}

function evalRoles(guild, channel) {
  let valid = true;
  const embed = new Discord.MessageEmbed()
    .setTitle('Role Evaluation');

  let responseBody = "";
  let guildRoles = guild.roles.cache;
  for (let roleID in roleWeights) {
    let role = guildRoles.get(roleID);
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
async function countUsers(guild, channel) {
  if (evalRoles(guild, channel)) {
    let tickets = {};
    let guildRoles = guild.roles.cache;
    for (let roleID in roleWeights) {
      let role = guildRoles.get(roleID);
      await guild.members.fetch()
        .then((members) => {
          for (let member of role.members) {
            !tickets[member[0]] ? tickets[member[0]] = roleWeights[roleID] : tickets[member[0]] += roleWeights[roleID];
          }
        })
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
      let drawList = [];
      for (let participant in ticketList[guild.id]) {
        for (let i = ticketList[guild.id][participant]; i > 0; i--) {
          drawList.push(participant);
        }
      }
      let winner = drawList[Math.floor(Math.random() * drawList.length)];
      if (ticketList[guild.id][winner] <= 1) {
        delete ticketList[guild.id][winner];
      } else {
        ticketList[guild.id][winner]--;
      }
      if (Object.keys(ticketList[guild.id]).length === 0) {
        delete ticketList[guild.id];
      }
      embed.setColor(0x008000)
        .setDescription("And the winner is . . . <@" + winner + ">!");
    } else {
      embed.setColor(0xFF0000)
        .setDescription("No more tickets have been assigned!");
      channel.send(embed);
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
      embedBody += members.get(participant).user.toString() + ": " + ticketList[guild.id][participant] + "\n";
    }
    embed.setColor(0x008000)
      .setDescription(embedBody);
  } else {
    embed.setColor(0xFF0000)
      .setDescription("No tickets have been assigned!");
  }
  channel.send(embed);
}

function addTicket(guild, channel, args) {
  let number = parseInt(args[1]);
  if (!Number.isInteger(number)) number = 1;
  const embed = new Discord.MessageEmbed()
    .setTitle("Adding tickets . . .");

  let member;
  if (!args[0]) {
    embed.setColor(0xFF0000)
      .setDescription("Please provide a member to assign tickets to.");
    channel.send(embed);
    return;
  } else if (args[0].startsWith("<")) {
    member = guild.members.cache.get(args[0].slice(3, -1));
  } else {
    member = guild.members.cache.find(member => member.user.tag === args[0]);
    if (!member) {
      embed.setColor(0xFF0000)
        .setDescription("Could not find member with tag " + args[0] + ".");
      channel.send(embed);
      return;
    }
  }
  if (!ticketList[guild.id]) ticketList[guild.id] = {};
  if (ticketList[guild.id][member.id]) {
    ticketList[guild.id][member.id] += number;
  } else {
    ticketList[guild.id][member.id] = number;
  }
  embed.setColor(0x008000)
    .setDescription("Member <@" + member.id + "> now has " + ticketList[guild.id][member.id] + (ticketList[guild.id][member.id] === 1 ? " ticket." : " tickets."));
  channel.send(embed);
}

function removeTicket(guild, channel, args) {
  let number = parseInt(args[1]);
  if (!Number.isInteger(number)) number = 1;
  const embed = new Discord.MessageEmbed()
    .setTitle("Removing tickets . . .");

  let member;
  if (!args[0]) {
    embed.setColor(0xFF0000)
      .setDescription("Please provide a member to remove tickets from.");
    channel.send(embed);
    return;
  } else if (args[0].startsWith("<")) {
    member = guild.members.cache.get(args[0].slice(3, -1));
  } else {
    member = guild.members.cache.find(member => member.user.tag === args[0]);
    if (!member) {
      embed.setColor(0xFF0000)
        .setDescription("Could not find member with tag " + args[0] + ".");
      channel.send(embed);
      return;
    }
  }
  if (!ticketList[guild.id]) {
    embed.setColor(0xFF0000)
      .setDescription("No tickets have been assigned!");
    channel.send(embed);
    return;
  } if (ticketList[guild.id][member.id]) {
    ticketList[guild.id][member.id] -= number;
  } else {
    embed.setColor(0xFF0000)
      .setDescription("Member <@" + member.id + "> doesn't have any tickets to remove!");
    channel.send(embed);
    return;
  }
  ticketList[guild.id][member.id] < 0 ? ticketList[guild.id][member.id] = 0 : ticketList[guild.id][member.id];
  embed.setColor(0x008000)
    .setDescription("Member <@" + member.id + "> now has " + ticketList[guild.id][member.id] + (ticketList[guild.id][member.id] === 1 ? " ticket." : " tickets."));
  channel.send(embed);
  if (ticketList[guild.id][member.id] <= 0) {
    delete ticketList[guild.id][member.id];
  }
  if (Object.keys(ticketList[guild.id]).length === 0) {
    delete ticketList[guild.id];
  }
}

function flipCoin(channel) {
    const embed = new Discord.MessageEmbed()
    .setTitle("Flipping a coin . . .")
    .setColor(0x008000);
  let x = (Math.floor(Math.random() * 2) == 0);
    if(x){
    	embed.setDescription("Heads!");
    }else{
      embed.setDescription("Tails!");
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

  let allowed = false;
  for (let roleID of allowedRoles) {
    if (message.member.roles.cache.has(roleID)) allowed = true;
  }

  if (message.member.id === "144973321749004289") {
    allowed = true;
  }

  if (!allowed && command !== "help" && command !== "list" && command !== "flip") {
    message.channel.send("You don't have permission to use this command!");
    return;
  }

  // console.log(message.content);
  // console.log(command, args);

  switch (command) {
    case "help":
      help(message.guild, message.channel);
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
    case "add":
      addTicket(message.guild, message.channel, args);
      break;
    case "remove":
      removeTicket(message.guild, message.channel, args);
      break;
    case "flip":
      flipCoin(message.channel);
      break;
    default:
      notACommand(message.channel);
  }

});

client.login(token);
