import { ApiProperty } from "@nestjs/swagger";

type UserWithoutPassword = Omit<UserEntity, 'password'>;

export class UserEntity implements UserWithoutPassword {
  @ApiProperty()
  id: number;
  @ApiProperty()
  email: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  avatar_url?: string;
  @ApiProperty()
  created_at: Date;
  @ApiProperty()
  updated_at: Date;
}
