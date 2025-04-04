const analyticService = require('./services/analyticsService');

const getMonthlyYearlySubmission = async (req, res) => {
    try {
        const analytics = await analyticService.getAnalyticsData()
        res.status(200).json(analytics);
    } catch (error) {
        console.error("Error fetching analytics data:", error);
        res.status(500).json({ message: error.message });
    }
};

const getApprovalRejectionRates = async (req, res) => {
    try {
        const { year, month } = req.query; 
        const rates = await analyticService.getApprovalRejectionRates(parseInt(year), parseInt(month));
        res.status(200).json(rates);
    } catch (error) {
        console.error("Error fetching approval/rejection rates:", error);
        res.status(500).json({ message: "Error fetching approval/rejection rates." });
    }
};

const getGenderBasedAnalytics = async (req, res) => {
    try {
        const { year, month } = req.query; 
        const data = await analyticService.getGenderBasedAnalytics(parseInt(year), parseInt(month));
        res.status(200).json(data);
    } catch (error) {
        console.error("Error fetching gender-based analytics data:", error);
        res.status(500).json({ message: "Failed to fetch gender-based analytics data." });
    }
};

const getYearLevelAnalyticsController = async (req, res) => {
    try {
        const yearLevelCounts = await analyticService.countStudentsByYearLevel();
        return res.status(200).json(yearLevelCounts);
    } catch (error) {
        console.error("Error fetching year-level analytics:", error);
        return res.status(500).json({ message: "Error fetching year-level analytics." });
    }
};

const getPaymentMethodAnalytics = async (req, res) => {
    try {
        const distribution = await analyticService.getPaymentMethodDistribution();
        res.status(200).json(distribution);
    } catch (error) {
        console.error("Error fetching payment method analytics:", error);
        res.status(500).json({ message: "Failed to fetch payment method analytics." });
    }
};

const getProvinceAnalytics = async (req, res) => {
    try{
        const analytics = await analyticService.getProvinceAnalytics()
        res.status(200).json(analytics);
    } catch (error) {
        console.error("Error fetching province analytics:", error);
        res.status(500).json({ message: "Error fetching province analytics"})
    }
};

const getAvailableMonthsAndYears = async (req, res) => {
    try {
        const availableData = await analyticService.getAvailableMonthsAndYears();
        res.status(200).json(availableData);
    } catch (error) {
        console.error("Error fetching available months and years:", error);
        res.status(500).json({ message: "Failed to fetch available months and years." });
    }
}



module.exports = { getAvailableMonthsAndYears, getYearLevelAnalyticsController, getGenderBasedAnalytics, getMonthlyYearlySubmission, getApprovalRejectionRates, getPaymentMethodAnalytics, getProvinceAnalytics };