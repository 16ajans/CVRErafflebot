import 'dotenv/config'
import { Client, Events, GatewayIntentBits } from 'discord.js';

const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
	allowedMentions: {
		"parse": []
	  }
});

client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});

var pool = []
//TODO handle "everyone" 

client.on(Events.InteractionCreate, async (interaction) => {
	if (interaction.member._roles.filter(role => process.env.ALLOWED_ROLES.includes(role)).length) { //TODO change to permission bitfield check?
		if (interaction.commandName === 'add') {
			if (interaction.options.getSubcommand() === 'user') {
				let n = interaction.options.getInteger('tickets') || 1
				for (n; n > 0; n--) {
					pool.push(interaction.options.getUser('user').id)
				}
				interaction.reply(`Added **${interaction.options.getInteger('tickets') || 1}** ticket(s) to the pool for <@${interaction.options.getUser('user').id}>.`)
			} else if (interaction.options.getSubcommand() === 'role') {
				let n = interaction.options.getInteger('tickets') || 1
				let users
				if (interaction.options.getRole('role').name === '@everyone') {
					users = (await interaction.guild.members.fetch())
				} else {
					users = (await interaction.guild.members.fetch()).filter(member => member._roles.includes(interaction.options.getRole('role').id))
				}
				if (users.size) {
					for (n; n > 0; n--) {
						const iterator = users.values()
						for (const user of iterator) {
							pool.push(user.id)						}
					}
					interaction.reply(`Added **${interaction.options.getInteger('tickets') || 1}** ticket(s) each for **${users.size}** users with role <@&${interaction.options.getRole('role').id}>.`)
				} else {
					interaction.reply('There are no users with this role!')
				}
			}
		}

		if (interaction.commandName === 'remove') {
			if (interaction.options.getSubcommand() === 'user') {
				let n = interaction.options.getInteger('tickets') || 1
				for (n; n > 0; n--) {
					if (pool.indexOf(interaction.options.getUser('user').id)) {
						pool.splice(pool.indexOf(interaction.options.getUser('user').id), 1)
					}
				}
				interaction.reply(`Removed **${interaction.options.getInteger('tickets') || 1}** of <@${interaction.options.getUser('user').id}>'s ticket(s) from the pool.`)
			} else if (interaction.options.getSubcommand() === 'role') {
				let n = interaction.options.getInteger('tickets') || 1
				let users
				if (interaction.options.getRole('role').name === '@everyone') {
					users = (await interaction.guild.members.fetch())
				} else {
					users = (await interaction.guild.members.fetch()).filter(member => member._roles.includes(interaction.options.getRole('role').id))
				}
				if (users.size) {
					for (n; n > 0; n--) {
						const iterator = users.values()
						for (const user of iterator) {
							if (pool.indexOf(user)) {
								pool.splice(pool.indexOf(user), 1)
							}
						}
					}
					interaction.reply(`Removed **${interaction.options.getInteger('tickets') || 1}** ticket(s) each from **${users.size}** users with role <@&${interaction.options.getRole('role').id}>.`)
				} else {
					interaction.reply('There are no users with this role!')
				}
			}
		}
		if (interaction.commandName === 'draw') {
			let n = interaction.options.getInteger('tickets') || 1
			let winners = []
			for (n; n > 0; n--) {
				let winner = pool[Math.floor(Math.random() * pool.length)]
				if (winners.indexOf(winner) < 0) {
					winners.push(winner)
					pool.splice(pool.indexOf(winner), 1)
				}
			}
			let tags = winners.map(winner => '<@' + winner + '>')
			interaction.reply(`Drawn winners:\n${tags.join(`\n`)}`)
		}
		if (interaction.commandName === 'pool') {
			interaction.reply(`There are **${new Set(pool).size}** users with a total of **${pool.length}** tickets in the drawing pool.`)
		}
		if (interaction.commandName === 'clear') {
			pool = []
			interaction.reply(`There are now **${new Set(pool).size}** users with a total of **${pool.length}** tickets in the drawing pool.`)
		}

	} else { interaction.reply('You do not have permission to run this command.')}
})

client.login(process.env.BOT_TOKEN);