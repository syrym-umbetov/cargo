-- Cargo App Database Schema
-- PostgreSQL Schema for cargo management application

-- Users table for authentication
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clients table
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    client_code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products/Items table
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    product_code VARCHAR(255) NOT NULL, -- Barcode data
    arrival_date DATE NOT NULL,
    quantity INTEGER DEFAULT 1,
    weight DECIMAL(10,3), -- в кг
    price_usd DECIMAL(10,2), -- цена в долларах
    exchange_rate DECIMAL(10,4), -- курс тенге к доллару
    amount_kzt DECIMAL(12,2), -- к оплате в тенге (price_usd * exchange_rate)
    cost_price DECIMAL(10,2), -- себестоимость
    margin DECIMAL(10,2), -- маржа
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exchange rates table for tracking currency
CREATE TABLE exchange_rates (
    id SERIAL PRIMARY KEY,
    currency_from VARCHAR(3) DEFAULT 'USD',
    currency_to VARCHAR(3) DEFAULT 'KZT',
    rate DECIMAL(10,4) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_clients_code ON clients(client_code);
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_items_client_id ON items(client_id);
CREATE INDEX idx_items_product_code ON items(product_code);
CREATE INDEX idx_items_arrival_date ON items(arrival_date);
CREATE INDEX idx_exchange_rates_date ON exchange_rates(date);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data
INSERT INTO clients (client_code, name, phone) VALUES
('CLI001', 'Иван Иванов', '+77777777777'),
('CLI002', 'Мария Петрова', '+77777777778');

INSERT INTO exchange_rates (rate, date) VALUES
(450.00, CURRENT_DATE);