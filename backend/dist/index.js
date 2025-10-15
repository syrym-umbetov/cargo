"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const auth_simple_1 = __importDefault(require("./routes/auth-simple"));
const clients_1 = __importDefault(require("./routes/clients"));
const items_1 = __importDefault(require("./routes/items"));
const exchange_rates_1 = __importDefault(require("./routes/exchange-rates"));
const analytics_1 = __importDefault(require("./routes/analytics"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
exports.prisma = prisma;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || '*'
}));
app.use(express_1.default.json());
app.use('/api/auth', auth_simple_1.default);
app.use('/api/clients', clients_1.default);
app.use('/api/items', items_1.default);
app.use('/api/exchange-rates', exchange_rates_1.default);
app.use('/api/analytics', analytics_1.default);
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map