import { NextFunction, Request, Response } from 'express';

const express = require('express');
const router = express.Router();

const { execSync } = require('child_process');
const fs = require('fs');
const moment = require("moment-timezone");
const path = require('path');

router.get('/systemInfo', async function(req: Request, res: Response, next: NextFunction) {
    try {
        console.log('get systemInfo() start');

        // get client build dt.
        let clientBuildDt = getFileUpdateDt(path.join(__dirname, '../../../../front/dist/index.html'));

        // get server build dt.
        let serverBuildDt = getFileUpdateDt(path.join(__dirname, '../../../../server/dist/app.js'));

        // get git log.
        let gitLog = getGitLog();

        console.log('get systemInfo() end');
        res.json({
            clientBuildDt: clientBuildDt,
            serverBuildDt: serverBuildDt,
            gitLog: gitLog?.toString(),
        });
    } catch (e) {
        console.log(e.stack);
        res.json({ message: e.message });
    }
});

// get file update dt.
function getFileUpdateDt(path: string) {
    try {
        const file = fs.statSync(path);
        const fileDt = moment(file.mtime).tz("Asia/Tokyo").format("YYYY/MM/DD HH:mm:ss");
        // console.log('file update dt:' + fileDt);
        return fileDt;
    } catch(e) {
        console.log(e.toString());
        return null;
    }
}

// get git log.
function getGitLog() {
    try {
        // const gitLog = execSync('git log -5 --no-merges --pretty=format:"[%ad] %h %an : %s" --date=format:"%Y/%m/%d %H:%M:%S"')
        const gitLog = execSync('git log --no-merges --pretty=format:"[%ad] %h %an : %s" --date=format:"%Y/%m/%d %H:%M:%S"')
        // console.log(`git log: ${gitLog.toString()}`)
        return gitLog;
    } catch(e) {
        console.log(e.toString());
        return null;
    }
}

module.exports = router;
