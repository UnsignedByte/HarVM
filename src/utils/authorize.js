/*
* @Author: UnsignedByte
* @Date:   12:44:59, 04-Jun-2020
* @Last Modified by:   UnsignedByte
* @Last Modified time: 00:07:55, 05-Jun-2020
*/

/*
 * Reference for names
	{
	  CREATE_INSTANT_INVITE: 1,
	  KICK_MEMBERS: 2,
	  BAN_MEMBERS: 4,
	  ADMINISTRATOR: 8,
	  MANAGE_CHANNELS: 16,
	  MANAGE_GUILD: 32,
	  ADD_REACTIONS: 64,
	  VIEW_AUDIT_LOG: 128,
	  PRIORITY_SPEAKER: 256,
	  STREAM: 512,
	  VIEW_CHANNEL: 1024,
	  SEND_MESSAGES: 2048,
	  SEND_TTS_MESSAGES: 4096,
	  MANAGE_MESSAGES: 8192,
	  EMBED_LINKS: 16384,
	  ATTACH_FILES: 32768,
	  READ_MESSAGE_HISTORY: 65536,
	  MENTION_EVERYONE: 131072,
	  USE_EXTERNAL_EMOJIS: 262144,
	  VIEW_GUILD_INSIGHTS: 524288,
	  CONNECT: 1048576,
	  SPEAK: 2097152,
	  MUTE_MEMBERS: 4194304,
	  DEAFEN_MEMBERS: 8388608,
	  MOVE_MEMBERS: 16777216,
	  USE_VAD: 33554432,
	  CHANGE_NICKNAME: 67108864,
	  MANAGE_NICKNAMES: 134217728,
	  MANAGE_ROLES: 268435456,
	  MANAGE_WEBHOOKS: 536870912,
	  MANAGE_EMOJIS: 1073741824
	}
*/

function authorize(Discord, msg, perms){
	if (!msg.member) throw new Error('Authorization-required commands only work on guilds!')
	if (!perms) return true;

	perms = perms.map((x)=>(val=>Discord.Permissions.FLAGS[val]||val)(x.toUpperCase().replace(/\s+/g, '_'))); //map to bitfield

	let perm = 0;
	for(let i = 0; i < perms.length; i++){
		perm|=perms[i];
	}
	return msg.member.permissions.has(perm);
	// if(!msg.member.permissions.has(perm)) throw new Error(`Insufficient Permissions to Run Command. The following permissions are required for authorization:\n\`${perms.join('`\n`')}\``);
}

export default authorize