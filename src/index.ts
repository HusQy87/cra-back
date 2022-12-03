import express from 'express'
import { body, validationResult } from 'express-validator';
import cors from 'cors'
import {PrismaClient, User} from "@prisma/client";
import * as bcrypt from 'bcrypt'
const app = express()
const prisma  = new PrismaClient()
import jwt from 'jsonwebtoken'
import passport, {session, use} from 'passport'
import {Strategy as JwtStrategy, ExtractJwt, StrategyOptions} from 'passport-jwt'
var opts = {}as StrategyOptions
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken()
opts.secretOrKey = 'proot'

passport.use(new JwtStrategy(opts,async (jwt_payload,done) => {
    const user = await prisma.user.findUnique({where:{id:jwt_payload.id} })
        if (user) {
            return done(null, user);
        } else {
            return done(null, false);
        }
}))





app.use(cors())
app.get('/', (req, res) => {
    res.send('🏠')
})
app.use(express.json())
app.post('/login', async (req, res) => {

    const user = await prisma.user.findFirst({where: {mail: req.body.mail}})
    if (user){
        if (await bcrypt.compare(req.body.mdp, user.mdp)){
            res.send({token: jwt.sign({mail: user.mail, id: user.id}, 'proot')})
        }
    }
    res.status(404)
})
app.post('/register',
    body('mail').notEmpty().isEmail(),
    body('mdp').notEmpty(),
    async (req, res) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        let register = req.body
        register.mdp = await bcrypt.hash(register.mdp, 10)
        const user = await prisma.user.create({data: req.body})

        res.send({})
})


app.get('/profile', passport.authenticate('jwt', {session: false}), async (req, res) => {
    const user = await req.user as User
    if (user === undefined){
        return;
    }
    const info = await prisma.info.findUnique({
        where:{
            userId: user.id
        }
    })
    res.json(info)
})
app.post('/profile', passport.authenticate('jwt', {session: false}), async (req, res) => {
    const user = await req.user as User
    if (user === undefined){
        return;
    }
    const info = await prisma.info.findUnique({
        where:{
            userId: user.id
        }
    })
    if (info === null){
        const info = req.body
        info.userId = user.id
        await prisma.info.create({data: info})
        res.send({})
    }
})


app.get('/user/infos', passport.authenticate('jwt', {session: false}), async  (req, res)=> {
    const userTmp = req.user as User
    const user = await prisma.user.findUnique({
        where: {
            id: userTmp.id
        },
        include: {
            info:true
        }
    })
    console.log(user)
    return res.send(user)
})

app.listen(process.env.PORT, () => {
    console.log("Silence ça tourne")
})
