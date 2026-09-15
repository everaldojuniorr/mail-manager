import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateMessageDto {
  @IsOptional()
  @IsUUID()
  folderId?: string;

  @IsOptional()
  @IsBoolean()
  seen?: boolean;

  @IsOptional()
  @IsBoolean()
  flagged?: boolean;
}
