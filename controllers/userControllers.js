const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const db = require('../config/db');

exports.signUp = async (req, res, next) => {
    try {
        const { id,email, password, name } = req.body;
        if (!email || !password || !name) {
            return res.status(400).send({ success: false, message: "Please provide all fields" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.query('INSERT INTO user (id,email, password, name) VALUES (?,?,?,?)', [id,email, hashedPassword, name]);

        if (!result) {
            return res.status(500).send({ success: false, message: "User not created" });
        }

        res.status(201).json({
            status: "success",
            data: { user: { id: result.insertId, email, name } }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
        next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password ) {
            return res.status(400).send({ success: false, message: "Please provide all fields" });
        }
        
        const [result] = await db.query('SELECT * FROM user WHERE email = ?', [email]);
        
        if (!result) {
            return res.status(500).send({ success: false, message: "User is not present or invalid user details" });
        }

        if (result.length === 0) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, result[0].password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: result[0].id }, process.env.SECRET_KEY, { expiresIn: '1h' });

        res.status(200).json({
            success: true,
            token,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
        next(error);
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const [users] = await db.query('SELECT * FROM user WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(404).send({ Status: "User not found" });
        }

        const user = users[0];
        const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY, { expiresIn: '2000s' });

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Prepare email options
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Reset your password',
            text: `http://localhost:3000/resetPassword/${user.id}/${token}`
        };

        // Send email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending email:", error);
                return res.status(500).send({ Status: "Failed to send email" });
            } else {
                console.log('Email sent: ' + info.response);
                return res.status(200).send({ Status: "Success", message: "Link sent to your email" });
            }
        });
    } catch (error) {
        console.error("Error in forgotPassword:", error);
        return res.status(500).send({ Status: "Internal Server Error" });
    }
};

exports.resetPassword = async (req, res, next) => {
    const { id, token } = req.params;
    const { password } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);

        if (decoded.id !== parseInt(id, 10)) {
            return res.status(400).json({ Status: "Invalid token" });
        }

        const hash = await bcrypt.hash(password, 12);
        const [result] = await db.query('UPDATE user SET password = ? WHERE id = ?', [hash, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ Status: "User not found" });
        }

        return res.json({ message: "Password reset successfully" });
    } catch (error) {
        res.status(400).json({ Status: error.message });
    }
};
exports.updatePassword = async (req, res, next) => {
    try {
        const { password, newPassword, confirmPassword } = req.body;
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!password || !newPassword || !confirmPassword || !token) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'New password and confirm password do not match' });
        }

        let userId;
        try {
            const decoded = jwt.verify(token, process.env.SECRET_KEY);
            userId = decoded.id;
        } catch (error) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        const [userResult] = await db.query('SELECT * FROM user WHERE id = ?', [userId]);

        if (userResult.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = userResult[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const [updateResult] = await db.query('UPDATE user SET password = ? WHERE id = ?', [hashedPassword, userId]);

        if (updateResult.affectedRows === 0) {
            return res.status(500).json({ message: 'Failed to update password' });
        }

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
        next(error);
    }
};

exports.updateDetails = async(req,res,next) => {
    try{
        const userID = req.params.id;
        if (!userID) {
            return res.status(400).send({ success: false, message: "Invalid or no user id provided" });
        }
        const { id, email,name} = req.body;
        const data = await db.query(`UPDATE user SET email = ?, name = ? WHERE id = ?`, [email, name, id]);
        if (!data || data.affectedRows === 0) {
            return res.status(404).send({ success: false, message: "Error in updating user" });
        }
        res.status(200).json({ success: true, message: "Updated successfully" });
    }catch(error){
        console.error(error);
        res.status(500).json({ message: 'Server error' });
        next(error);
    }
}

exports.deleteDetails = async(req,res,next) => {
    try{
        const userID = req.params.id;
        if (!userID) {
            return res.status(400).send({ success: false, message: "Invalid or no user id provided" });
        }
        const data = await db.query(`DELETE FROM user WHERE id = ?`, [userID]);
        if (!data || data.affectedRows === 0) {
            return res.status(404).send({ success: false, message: "Error in deleating user" });
        }
        res.status(200).json({ success: true, message: "user deleated  successfully" });
    }catch(error){
        console.error(error);
        res.status(500).json({ message: 'Server error' });
        next(error);
    }
}