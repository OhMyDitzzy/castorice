import makeWASockets, { type UserFacingSocketConfig } from "baileys"

export function _makeWASockets(config: UserFacingSocketConfig, options: any = {}) {
    let conn = makeWASockets(config);

    let sock = Object.defineProperties(conn, {
        chats: {
            value: { ...(options.chats || {}) },
            writable: true          
        },

        decodeJid: {
            value(jid: string) {
                if (!jid || typeof jid !== "string")
                    return (!nullish(jid) && jid) || null;
                return jid;
            }
        }

    });

    return sock;
}

function nullish(args: any) {
    return !(args !== null && args !== undefined);
}