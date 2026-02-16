import { Router } from "express"

import {
    getAggregatesForCharts, getLatestActivities, getOverview
} from "../controllers/stats.controller.js"

const statsRouter = Router()

statsRouter.get('/overview', getOverview)

statsRouter.get('/latest', getLatestActivities)

statsRouter.get('/charts', getAggregatesForCharts)

export default statsRouter