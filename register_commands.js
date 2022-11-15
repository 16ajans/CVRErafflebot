import 'dotenv/config'
import { REST, Routes } from 'discord.js';

//TODO min/max values for tickets

const commands = [
	{
		name: 'pool',
        type: 1,
		description: 'Shows information on current raffle pool.',
	},
    {
		name: 'add',
        type: 1,
		description: 'Adds tickets for a user or users with a role to the raffle pool.',
        options: [
            {
                "name": "user",
                "type": 1,
                "description": "Adds tickets for a user to the raffle pool.",
                "options": [
                    {
                        "name": "user",
                        "description": "The user to be added to.",
                        "type": 6,
                        "required": "true"
                    },
                    {
                        name: 'tickets',
                        description: 'The number of tickets to be added.',
                        type: 4
                    }
                ]
            },
            {
                "name": "role",
                "type": 1,
                "description": "Adds tickets for users with a role to the raffle pool.",
                "options": [
                    {
                        "name": "role",
                        "description": "The role to be added to.",
                        "type": 8,
                        "required": "true"
                    },
                    {
                        name: 'tickets',
                        description: 'The number of tickets to be added for each user.',
                        type: 4
                    }
                ]
            }
        ]
	},
    {
		name: 'remove',
        type: 1,
		description: 'Removes tickets from a user or users with a role in the raffle pool.',
        options: [
            {
                "name": "user",
                "type": 1,
                "description": "Removes tickets from a user in the raffle pool.",
                "options": [
                    {
                        "name": "user",
                        "description": "The user to be removed from.",
                        "type": 6,
                        "required": "true"
                    },
                    
                    {
                        name: 'tickets',
                        description: 'The number of tickets to be removed.',
                        type: 4
                    }
                ]
            },
            {
                "name": "role",
                "type": 1,
                "description": "Removes tickets from users with a role in the raffle pool.",
                "options": [
                    {
                        "name": "role",
                        "description": "The role to be removed from.",
                        "type": 8,
                        "required": "true"
                    },
                    
                    {
                        name: 'tickets',
                        description: 'The number of tickets to be removed from each user.',
                        type: 4
                    }
                ]
            }
        ]
	},
    {
        name: 'draw',
        type: 1,
        description: 'Draws tickets from the raffle pool.',
        options: [
            {
                name: "tickets",
                description: "Number of tickets to be drawn.",
                type: 4
            }
        ]
    },
    {
        name: 'clear',
        type: 1,
        description: 'Clears all tickets from the raffle pool.'
    }
];

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

(async () => {
	try {
		console.log('Started refreshing application (/) commands.');

		await rest.put(Routes.applicationCommands(process.env.APP_ID), { body: commands });

		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
})();