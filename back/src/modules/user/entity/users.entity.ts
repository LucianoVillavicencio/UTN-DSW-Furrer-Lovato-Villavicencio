import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";


@Entity("users")

export class Users{
    
    @PrimaryGeneratedColumn()
    idUsuario!: number;

    @Column({type: String, nullable:false, length: 30})
    email!: string;

    @Column({type: String, nullable:false, length: 20})
    name!: string;

    @Column({type: String, nullable:false, length: 20})
    surname!: string;

    @Column({type: String, nullable:false, length: 20})
    phone!: string;

    @Column({type: String, nullable:false, length: 30})
    password!: string;

    @Column({type: Boolean, nullable:false, default:false})
    deleted!: boolean;
}