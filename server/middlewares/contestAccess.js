const isValidDate = (date) => {
    return date instanceof Date && !isNaN(date);
};

/**
 * Lightweight middleware to just verify contest exists
 * Used for viewing contest details/items without strict access validation
 */
const validateContestExists = async (req, res, next) => {
    try {
        const contestId = req.params.contestId;

        // Get contest details
        const [[contest]] = await req.db.execute(
            'SELECT * FROM contests WHERE id = ?',
            [contestId]
        );

        if (!contest) {
            return res.status(404).json({
                status: 'error',
                message: 'Contest not found'
            });
        }

        // Store contest in request for later use
        req.contest = contest;
        next();
    } catch (error) {
        console.error('Contest validation error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to validate contest'
        });
    }
};

/**
 * Middleware to validate contest access based on start/end times
 */
const validateContestAccess = async (req, res, next) => {
    try {
        const contestId = req.params.contestId;
        const now = new Date();

        // Get contest details
        const [[contest]] = await req.db.execute(
            'SELECT * FROM contests WHERE id = ?',
            [contestId]
        );

        if (!contest) {
            return res.status(404).json({
                status: 'error',
                message: 'Contest not found'
            });
        }

        // Store contest in request for later use
        req.contest = contest;

        const startTime = new Date(contest.start_time);
        const endTime = new Date(contest.end_time);

        // Validate date objects
        if (!isValidDate(startTime) || !isValidDate(endTime)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid contest time configuration'
            });
        }

        // Check if contest has started
        if (now < startTime) {
            return res.status(403).json({
                status: 'error',
                message: 'Contest has not started yet',
                startTime: startTime.toISOString(),
                currentTime: now.toISOString()
            });
        }

        // Check if contest has ended
        if (now > endTime) {
            return res.status(403).json({
                status: 'error',
                message: 'Contest has ended',
                endTime: endTime.toISOString(),
                currentTime: now.toISOString()
            });
        }

        // Check if user is registered for the contest
        const [[participant]] = await req.db.execute(
            'SELECT * FROM contest_participants WHERE contest_id = ? AND user_id = ?',
            [contestId, req.user.id]
        );

        if (!participant) {
            return res.status(403).json({
                status: 'error',
                message: 'You are not registered for this contest'
            });
        }

        // Check if participant is active
        if (participant.status !== 'active') {
            return res.status(403).json({
                status: 'error',
                message: 'Your participation status is not active',
                status: participant.status
            });
        }

        next();
    } catch (error) {
        console.error('Contest access validation error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to validate contest access'
        });
    }
};

module.exports = {
  checkContestAccess: validateContestAccess,
  checkContestExists: validateContestExists
};