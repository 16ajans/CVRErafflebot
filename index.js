import 'dotenv/config'
import { Client, Events, GatewayIntentBits } from 'discord.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});


function pool() {
}
function draw(number) {

} 
function addUser(userID, number) {

}
function addRole(roleID, number) {

}
function removeUser(userID, number) {

}
function removeRole(roleID, number) {

}

client.on(Events.InteractionCreate, async (interaction) => {
	console.log(interaction)
	if (interaction.member._roles.filter(role => process.env.ALLOWED_ROLES.includes(role)).length) {
		interaction.reply('hello')
	} else { interaction.reply('You do not have permission to run this command.')}
})

// client.login(process.env.BOT_TOKEN);