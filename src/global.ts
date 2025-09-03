import path from "path";
/** define path (address) of root folder */
export const BASE_URL = `${path.join(__dirname,"../")}`
export const PORT = process.env.PORT
export const SECRET = process.env.SECRET
export const JWT_SECRET = process.env.JWT_SECRET || "default_secret";
