import { File, Download, Eye, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"

const files = [
  { id: 1, name: "Blood_Test_Report.pdf", size: "2.4 MB", date: "Oct 12, 2023" },
  { id: 2, name: "X-Ray_Chest.png", size: "5.1 MB", date: "Sep 28, 2023" },
  { id: 3, name: "Insurance_Card.jpg", size: "1.2 MB", date: "Aug 15, 2023" },
]

export function PatientAttachments() {
  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="flex items-center justify-center p-8 border-2 border-dashed border-[rgba(107,156,255,0.3)] dark:border-[rgba(107,156,255,0.2)] rounded-[20px] bg-[#6B9CFF]/5 dark:bg-[#6B9CFF]/5 hover:bg-[#6B9CFF]/10 transition-colors cursor-pointer">
        <div className="text-center">
          <Upload className="h-8 w-8 text-[#6B9CFF] mx-auto mb-2" />
          <p className="text-sm font-semibold text-foreground">Drop files here or click to upload</p>
          <p className="text-xs text-muted-foreground mt-1">PDF, Images, Documents (Max 10MB)</p>
        </div>
      </div>

      {/* File Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {files.map((file) => (
          <div 
            key={file.id} 
            className="group p-5 rounded-[18px] bg-white dark:bg-[#223247] border border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] shadow-[0_8px_20px_rgba(100,116,139,0.06)] hover:-translate-y-1 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 rounded-lg bg-[#6B9CFF]/10">
                <File className="h-5 w-5 text-[#6B9CFF]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{file.size} • {file.date}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 border-t border-[rgba(148,163,184,0.1)] dark:border-[rgba(255,255,255,0.06)] pt-3">
              <Button variant="ghost" size="sm" className="h-8 text-xs text-[#5BC0BE] hover:text-[#5BC0BE] hover:bg-[#5BC0BE]/10">
                <Eye className="h-3.5 w-3.5 mr-1" /> Preview
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-xs text-[#6B9CFF] hover:text-[#6B9CFF] hover:bg-[#6B9CFF]/10">
                <Download className="h-3.5 w-3.5 mr-1" /> Download
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-xs text-[#EF6B6B] hover:text-[#EF6B6B] hover:bg-[#EF6B6B]/10 ml-auto">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}