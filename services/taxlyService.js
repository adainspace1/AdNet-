// services/taxlyService.js
const axios = require('axios');
require('dotenv').config();

const TAXLY_BASE_URL = process.env.TAXLY_BASE_URL || 'https://dev.taxly.ng/api/v1';
const TAXLY_API_KEY = process.env.TAXLY_API_KEY;

/**
 * Taxly API Client
 * Handles all interactions with Taxly's taxation platform API
 */
class TaxlyService {
    constructor() {
        this.baseURL = TAXLY_BASE_URL;
        this.apiKey = TAXLY_API_KEY;

        // Create axios instance with default config
        this.client = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': this.apiKey
            },
            timeout: 30000 // 30 seconds
        });

        // Add response interceptor for error handling
        this.client.interceptors.response.use(
            response => response,
            error => this._handleError(error)
        );
    }

    /**
     * Centralized error handler
     */
    _handleError(error) {
        if (error.response) {
            // Server responded with error status
            const errorData = {
                status: error.response.status,
                message: error.response.data?.message || 'Taxly API Error',
                data: error.response.data
            };
            console.error('❌ Taxly API Error:', errorData);
            throw new Error(errorData.message);
        } else if (error.request) {
            // Request made but no response
            console.error('❌ Taxly API - No Response:', error.message);
            throw new Error('Failed to connect to Taxly API');
        } else {
            // Something else happened
            console.error('❌ Taxly API - Request Error:', error.message);
            throw new Error(error.message);
        }
    }

    // ========================================
    // AUTH CATEGORY
    // ========================================

    /**
     * Register a new tenant, organization, and user
     * @param {Object} data - Registration data
     * @returns {Promise<Object>} Registration response
     */
    async register(data) {
        try {
            const response = await this.client.post('/auth/register', data);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Authenticate an existing user
     * @param {Object} credentials - { email, password }
     * @returns {Promise<Object>} Login response with token
     */
    async login(credentials) {
        try {
            const response = await this.client.post('/auth/login', credentials);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Taxpayer-specific login
     * @param {Object} credentials - Taxpayer credentials
     * @returns {Promise<Object>} Taxpayer login response
     */
    async taxpayerLogin(credentials) {
        try {
            const response = await this.client.post('/auth/tax-payer-login', credentials);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // ========================================
    // RESOURCES CATEGORY
    // ========================================

    /**
     * Get all available tax categories and rates
     * @returns {Promise<Array>} Tax categories
     */
    async getTaxCategories() {
        try {
            const response = await this.client.get('/resources/tax-categories');
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Validate and retrieve taxpayer details by TIN
     * @param {String} tinNumber - Tax Identification Number
     * @returns {Promise<Object>} Taxpayer details
     */
    async validateTIN(tinNumber) {
        try {
            const response = await this.client.get(`/resources/tin/${tinNumber}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get supported invoice types
     * @returns {Promise<Array>} Invoice types
     */
    async getInvoiceTypes() {
        try {
            const response = await this.client.get('/resources/invoice-types');
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get available payment methods
     * @returns {Promise<Array>} Payment means
     */
    async getPaymentMeans() {
        try {
            const response = await this.client.get('/resources/payment-means');
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // ========================================
    // INVOICES CATEGORY
    // ========================================

    /**
     * Validate invoice data against FIRS rules
     * @param {Object} invoiceData - Invoice to validate
     * @returns {Promise<Object>} Validation result
     */
    async validateInvoice(invoiceData) {
        try {
            const response = await this.client.post('/invoices/validate', invoiceData);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Submit a prepared invoice for tax processing
     * @param {Object} invoiceData - Invoice to submit
     * @returns {Promise<Object>} Submission result with IRN
     */
    async submitInvoice(invoiceData) {
        try {
            const response = await this.client.post('/invoices/submit', invoiceData);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Transmit an invoice to FIRS
     * @param {String} irn - Invoice Reference Number
     * @returns {Promise<Object>} Transmission result
     */
    async transmitInvoice(irn) {
        try {
            const response = await this.client.post(`/invoices/${irn}/transmit`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Confirm the status of a transmitted invoice
     * @param {String} irn - Invoice Reference Number
     * @returns {Promise<Object>} Invoice status
     */
    async confirmInvoiceStatus(irn) {
        try {
            const response = await this.client.get(`/invoices/${irn}/confirm`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Download official tax invoice document
     * @param {String} irn - Invoice Reference Number
     * @returns {Promise<Object>} Download URL or file data
     */
    async downloadInvoice(irn) {
        try {
            const response = await this.client.get(`/invoices/${irn}/download`, {
                responseType: 'blob' // For file download
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // ========================================
    // BUYER CATEGORY
    // ========================================

    /**
     * Accept an invoice as a buyer
     * @param {String} invoiceId - Invoice ID
     * @param {Object} data - Acceptance data
     * @returns {Promise<Object>} Acceptance result
     */
    async acceptInvoice(invoiceId, data = {}) {
        try {
            const response = await this.client.post(`/buyer/invoices/${invoiceId}/accept`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Reject an invoice as a buyer
     * @param {String} invoiceId - Invoice ID
     * @param {Object} data - Rejection data with reason
     * @returns {Promise<Object>} Rejection result
     */
    async rejectInvoice(invoiceId, data = {}) {
        try {
            const response = await this.client.post(`/buyer/invoices/${invoiceId}/reject`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // ========================================
    // TENANTS CATEGORY
    // ========================================

    /**
     * Get tenant details
     * @param {String} tenantId - Tenant ID
     * @returns {Promise<Object>} Tenant details
     */
    async getTenantDetails(tenantId) {
        try {
            const response = await this.client.get(`/tenants/${tenantId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update tenant information
     * @param {String} tenantId - Tenant ID
     * @param {Object} data - Updated tenant data
     * @returns {Promise<Object>} Update result
     */
    async updateTenant(tenantId, data) {
        try {
            const response = await this.client.put(`/tenants/${tenantId}`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
}

// Export singleton instance
module.exports = new TaxlyService();
