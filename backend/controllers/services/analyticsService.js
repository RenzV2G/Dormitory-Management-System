const FormModel = require('../../models/FormModel');
const CurrentStudent = require('../../models/CurrentStudent');
const AnalyticsModel = require('../../models/AnalyticsModel');
const PaymentModel = require('../../models/PaymentModel');


const getAnalyticsData = async () => {
    try{
        return await AnalyticsModel.find().sort({ year: -1, month: -1 });
    } catch(error){
        console.error("Error in getting the Analytics Data", error);
        throw new Error("Failed to fetch Analytics data.");
    }
}

const generateMonthlyAnalytics = async () => {
    try {
        const submissionByMonthYear = await FormModel.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: "$submittedAt" },
                        month: { $month: "$submittedAt" },
                    },
                    count: { $sum: 1 },
                },
            },
        ]);

        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;

        // Ensure current month/year is initialized in AnalyticsModel
        const existingRecord = await AnalyticsModel.findOne({ year: currentYear, month: currentMonth });
        if (!existingRecord) {
            await AnalyticsModel.create({
                year: currentYear,
                month: currentMonth,
                submissionCount: 0, // Default to 0 submissions
                approvedCount: 0,
                rejectedCount: 0,
            });
        }

        for (const record of submissionByMonthYear) {
            const { year, month } = record._id;
            const count = record.count;

            await AnalyticsModel.findOneAndUpdate(
                { year, month },
                { $set: { year, month }, $inc: { submissionCount: count } },
                { upsert: true, new: true }
            );
        }
    } catch (error) {
        console.error("Error in generateMonthlyAnalytics:", error);
        throw new Error("Failed to generate analytics data.");
    }
};

const incrementField = async (year, month, field) => {
    try {
        const result = await AnalyticsModel.findOneAndUpdate(
            { year, month },
            { $inc: { [field]: 1 } },
            { upsert: true, new: true }
        );
    } catch (error) {
        console.error(`Error incrementing ${field}:`, error);
        throw new Error(`Failed to increment ${field}.`);
    }
};

const incrementApprovedCount = async (year, month) => {
    await incrementField(year, month, 'approvedCount');
};

const incrementRejectedCount = async (year, month) => {
    await incrementField(year, month, 'rejectedCount');
};

const getApprovalRejectionRates = async (year, month) => {
    try {
        let analytics = await AnalyticsModel.aggregate([
            { $match: { year, month } }, 
            {
                $project: {
                    _id: 0,
                    approvedCount: 1,
                    rejectedCount: 1,
                },
            },
        ]);

        if (!analytics || analytics.length === 0) {
            analytics = await AnalyticsModel.findOne({ year, month })
                .sort({ year: -1, month: -1 }) 
                .select("approvedCount rejectedCount")
                .lean();
            
            if (!analytics) {
                return {
                    approvedPercentage: "0.00", 
                    rejectedPercentage: "0.00", 
                };
            }
        }

        const { approvedCount, rejectedCount } = analytics[0] || analytics;
        const total = approvedCount + rejectedCount;

        return {
            approvedPercentage: total > 0 ? (approvedCount / total * 100).toFixed(2) : "0.00",
            rejectedPercentage: total > 0 ? (rejectedCount / total * 100).toFixed(2) : "0.00",
        };
    } catch (error) {
        console.error("Error fetching approval/rejection rates:", error);
        throw new Error("Failed to fetch approval/rejection rates.");
    }
};


const updateGenderBasedAnalytics = async (year, month, gender, action) => {
    try {
        const analytics = await AnalyticsModel.findOneAndUpdate(
            { year, month },
            { 
                $setOnInsert: {
                    submissionCount: 0,
                    approvedCount: 0,
                    rejectedCount: 0,
                    genderBased: {
                        male: { totalSubmissions: 0, approvedCount: 0, rejectedCount: 0 },
                        female: { totalSubmissions: 0, approvedCount: 0, rejectedCount: 0 },
                    }
                }
            },
            { upsert: true, new: true }
        );

        if (!analytics) throw new Error('Failed to fetch or create analytics document.');

        // Update overall counts
        const overallField = action === 'submission' ? 'submissionCount' 
                          : action === 'approve' ? 'approvedCount' 
                          : 'rejectedCount';
        const incrementOverall = { $inc: { [overallField]: 1 } };

        // Update gender-based counts
        const genderField = `genderBased.${gender.toLowerCase()}.${
            action === 'submission' ? 'totalSubmissions'
            : action === 'approve' ? 'approvedCount'
            : 'rejectedCount'
        }`;

        const incrementGender = { $inc: { [genderField]: 1 } };

        // Apply updates
        await AnalyticsModel.updateOne({ year, month }, { ...incrementOverall, ...incrementGender });
    } catch (error) {
        console.error('Error updating gender-based analytics:', error);
        throw new Error('Failed to update gender-based analytics.');
    }
};

const getGenderBasedAnalytics = async (year, month) => {
    try {
        let analytics = await AnalyticsModel.findOne(
            { year, month },
            {
                _id: 0,
                year: 1,
                month: 1,
                genderBased: 1,
            }
        );

        
        if (!analytics) {
            analytics = await AnalyticsModel.findOne({})
                .sort({ year: -1, month: -1 }) 
                .select("year month genderBased")
                .lean();

            if (!analytics) {
                return {
                    year,
                    month,
                    genderBased: {
                        male: { totalSubmissions: 0, approvedCount: 0, rejectedCount: 0 },
                        female: { totalSubmissions: 0, approvedCount: 0, rejectedCount: 0 },
                    },
                };
            }
        }

        return analytics;
    } catch (error) {
        console.error("Error fetching gender-based analytics data:", error);
        throw new Error("Failed to fetch gender-based analytics data.");
    }
};

const countStudentsByYearLevel = async () => {
    try {
        const yearLevelCounts = await CurrentStudent.aggregate([
            {
                $group: {
                    _id: "$personalInfo.yearLevel", 
                    count: { $sum: 1 } 
                }
            },
            {
                $project: {
                    yearLevel: "$_id", 
                    count: 1,          
                    _id: 0             
                }
            },
            {
                $sort: { yearLevel: 1 } 
            }
        ]);

        // Return the aggregated counts
        return yearLevelCounts;
    } catch (error) {
        console.error("Error counting students by year level:", error);
        throw new Error("Failed to count students by year level.");
    }
}


const getPaymentMethodDistribution = async () => {
    try {
        const paymentDistribution = await PaymentModel.aggregate([
            {
                $group: {
                    _id: "$paymentBy",
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } }, 
            { $limit: 3 }, 
            {
                $project: {
                    paymentMethod: "$_id",
                    count: 1,
                    _id: 0,
                },
            }
        ]);
        return paymentDistribution;
    } catch (error) {
        console.error("Error fetching payment method distribution:", error);
        throw new Error("Failed to fetch payment method distribution.");
    }
};


const getProvinceAnalytics = async () => {
    try {
        const analytics = await AnalyticsModel.aggregate([
            { $unwind: "$provinceAnalytics" },
            {
                $project: {
                    province: "$provinceAnalytics.province",
                    submissionCount: "$provinceAnalytics.submissionCount",
                },
            },
            { $sort: { submissionCount: -1 } },
        ]);
        return analytics;
    } catch (error) {
        console.error("Error fetching province analytics:", error);
        throw new Error("Failed to fetch province analytics.");
    }
};

const updateProvinceAnalytics = async (month, year, province) => {
    try {
      const existingRecord = await AnalyticsModel.findOne({ year, month });
  
      if (existingRecord) {
        const existingProvince = existingRecord.provinceAnalytics.find(p => p.province.toLowerCase() === province.toLowerCase());
  
        if (existingProvince) {
          existingProvince.submissionCount += 1;
          await existingRecord.save();
        } else {
          existingRecord.provinceAnalytics.push({
            province,
            submissionCount: 1,
          });
          await existingRecord.save();
        }
      } else {
        await AnalyticsModel.create({
          year,
          month,
          provinceAnalytics: [{
            province,
            submissionCount: 1,
          }],
        });
      }
    } catch (error) {
      console.error("Error updating province analytics:", error);
      throw new Error("Failed to update province analytics.");
    }
  };

  const getAvailableMonthsAndYears = async () => {
    try {
        const availableData = await AnalyticsModel.aggregate([
            { 
                $match: { 
                    $or: [
                        { "genderBased.male.totalSubmissions": { $gt: 0 } },
                        { "genderBased.female.totalSubmissions": { $gt: 0 } }
                    ]
                } 
            },
            { 
                $group: { 
                    _id: { year: "$year", month: "$month" } 
                } 
            },
            { 
                $sort: { "_id.year": -1, "_id.month": -1 } 
            }
        ]);

        return availableData.map(entry => ({
            year: entry._id.year,
            month: entry._id.month
        }));
    } catch (error) {
        console.error("Error fetching available months and years:", error);
        throw new Error("Failed to fetch available months and years.");
    }
};


module.exports = { countStudentsByYearLevel, getGenderBasedAnalytics, updateGenderBasedAnalytics, getApprovalRejectionRates, incrementApprovedCount, incrementRejectedCount, getAnalyticsData, generateMonthlyAnalytics, getPaymentMethodDistribution, getProvinceAnalytics, updateProvinceAnalytics, getAvailableMonthsAndYears };

