import { UserRequest } from "@/lib/dtos/users/user-request.dto";
import { UserService } from "@/lib/services/user.service";
import { NextResponse } from 'next/server';

export async function POST(request:Request) {
    try{
        const data : UserRequest = await request.json();
        const service = new UserService();
        const created = await service.create(data);
        return NextResponse.json({ 
            message: "Usuario creado",
            received: created
        },{status:201});
    } catch(error){
        if(error instanceof Error){
            console.log(error.message)
            return NextResponse.json({
                message: error.message
            },{
                status:500
            })
        }
    }
}

export async function GET() {
    return NextResponse.json({
        message:"Get vivo"
    },{status:200})
}